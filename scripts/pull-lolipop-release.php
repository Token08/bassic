<?php
// Cron only. The operations directory must also deny web access.
if (isset($_SERVER['REQUEST_METHOD'])) {
    http_response_code(404);
    exit;
}

const RELEASE_API = 'https://api.github.com/repos/Token08/bassic/releases/tags/bassic-production';
const RELEASE_URL = 'https://github.com/Token08/bassic/releases/download/bassic-production/bassic-site.release';
const MAX_PACKAGE_BYTES = 67109128;

function check($condition, $message) {
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

function fetchRelease($url, $destination, $limit) {
    $file = fopen($destination, 'wb');
    check($file !== false, 'Could not open download');
    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_FILE => $file, CURLOPT_FOLLOWLOCATION => true, CURLOPT_MAXREDIRS => 3,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTPS, CURLOPT_REDIR_PROTOCOLS => CURLPROTO_HTTPS,
        CURLOPT_CONNECTTIMEOUT => 8, CURLOPT_TIMEOUT => 60, CURLOPT_USERAGENT => 'Bassic publisher',
        CURLOPT_NOPROGRESS => false,
        CURLOPT_PROGRESSFUNCTION => static function ($handle, $total, $downloaded) use ($limit) {
            return ($total > $limit || $downloaded > $limit) ? 1 : 0;
        },
    ]);
    $ok = curl_exec($curl) && curl_getinfo($curl, CURLINFO_HTTP_CODE) === 200;
    curl_close($curl);
    fclose($file);
    check($ok && filesize($destination) <= $limit, 'Release download failed');
}

function verifiedFiles(ZipArchive $zip) {
    check($zip->numFiles > 0 && $zip->numFiles <= 1500, 'Invalid number of release files');
    $files = [];
    $total = 0;
    for ($i = 0; $i < $zip->numFiles; ++$i) {
        $entry = $zip->statIndex($i);
        $name = $entry['name'];
        check(preg_match('~\A(?:[A-Za-z0-9_\[\]-][A-Za-z0-9._\[\]-]*/)*[A-Za-z0-9_\[\]-][A-Za-z0-9._\[\]-]*\.(?:html|txt|js|css|json|xml|svg|ico|png|jpg|jpeg|webp|avif|gif|woff2?|pdf)\z~i', $name), 'Unsafe release path');
        check(!isset($files[$name]) && $entry['size'] <= 16 * 1024 * 1024, 'Invalid archive entry');
        $total += $entry['size'];
        check($total <= 128 * 1024 * 1024, 'Release expands beyond limit');
        $files[$name] = $entry['size'];
    }
    check(isset($files['index.html'], $files['robots.txt'], $files['sitemap.xml'], $files['_bassic-build.json']), 'Missing critical files');
    return $files;
}

function publishEntry(ZipArchive $zip, $root, $name, $size) {
    $path = $root;
    $parts = explode('/', $name);
    $basename = array_pop($parts);
    foreach ($parts as $part) {
        $path .= '/' . $part;
        check(!is_link($path), 'Unexpected directory link');
        check(is_dir($path) || mkdir($path, 0755), 'Could not create release directory');
    }
    $body = $zip->getFromName($name);
    check(is_string($body) && strlen($body) === $size, 'Could not extract verified file');
    $destination = $path . '/' . $basename;
    if (is_file($destination) && !is_link($destination) && hash_file('sha256', $destination) === hash('sha256', $body)) {
        return;
    }
    $temporary = tempnam($path, '.bassic-publish-');
    check(is_string($temporary), 'Could not create temporary file');
    try {
        check(file_put_contents($temporary, $body) === $size, 'Incomplete file write');
        check(chmod($temporary, 0644) && rename($temporary, $destination), 'Could not replace release file');
    } finally {
        if (file_exists($temporary)) {
            unlink($temporary);
        }
    }
}

$lock = fopen(__DIR__ . '/release.lock', 'c');
if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) {
    exit;
}
$temp = __DIR__ . '/incoming';
$archive = __DIR__ . '/verified.zip';
$statusPath = __DIR__ . '/publish-status.json';
try {
    $root = dirname(__DIR__);
    check(basename($root) === 'bassic-site-v2' && !is_link($root), 'Invalid production directory');
    fetchRelease(RELEASE_API, $temp, 262144);
    $release = json_decode(file_get_contents($temp), true);
    $assetId = null;
    foreach ($release['assets'] ?? [] as $asset) {
        if (($asset['name'] ?? '') === 'bassic-site.release') {
            $assetId = $asset['id'] ?? null;
        }
    }
    check(is_int($assetId), 'No production asset available');
    $status = is_file($statusPath) ? json_decode(file_get_contents($statusPath), true) : [];
    if (($status['asset'] ?? null) === $assetId) {
        return;
    }
    fetchRelease(RELEASE_URL, $temp, MAX_PACKAGE_BYTES);
    $handle = fopen($temp, 'rb');
    check(fread($handle, 8) === 'BASSIC01', 'Invalid release format');
    $signature = fread($handle, 256);
    $body = stream_get_contents($handle);
    fclose($handle);
    $key = file_get_contents(__DIR__ . '/release-public.pem');
    check(openssl_verify($body, $signature, $key, OPENSSL_ALGO_SHA256) === 1, 'Invalid release signature');
    check(file_put_contents($archive, $body) === strlen($body), 'Could not stage verified archive');
    unset($body);
    $zip = new ZipArchive();
    check($zip->open($archive, ZipArchive::CHECKCONS) === true, 'Cannot read verified archive');
    $files = verifiedFiles($zip);
    $build = json_decode($zip->getFromName('_bassic-build.json'), true);
    $run = $build['run'] ?? null;
    check(is_int($run) && $run > ($status['run'] ?? 0) && preg_match('/\A[a-f0-9]{40}\z/', $build['commit'] ?? ''), 'Invalid or stale release identity');
    $order = static function ($name) {
        if ($name === '_bassic-build.json') return 4;
        if ($name === 'index.html') return 3;
        if (substr($name, -5) === '.html') return 2;
        if (substr($name, -4) === '.txt') return 1;
        return 0;
    };
    uksort($files, static function ($a, $b) use ($order) { return [$order($a), $a] <=> [$order($b), $b]; });
    foreach ($files as $name => $size) {
        publishEntry($zip, $root, $name, $size);
    }
    $zip->close();
    $result = json_encode(['asset' => $assetId, 'run' => $run, 'commit' => $build['commit'], 'files' => count($files), 'at' => gmdate('c')]);
    check(file_put_contents($statusPath . '.tmp', $result) === strlen($result) && rename($statusPath . '.tmp', $statusPath), 'Could not record deployed release');
    if (is_file(__DIR__ . '/publish-error.txt')) unlink(__DIR__ . '/publish-error.txt');
} catch (Throwable $error) {
    file_put_contents(__DIR__ . '/publish-error.txt', gmdate('c') . ' ' . $error->getMessage() . PHP_EOL, LOCK_EX);
} finally {
    if (is_file($archive)) unlink($archive);
    if (is_file($temp)) unlink($temp);
    flock($lock, LOCK_UN);
    fclose($lock);
}
