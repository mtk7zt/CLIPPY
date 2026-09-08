$ErrorActionPreference = "Stop"

$pins = @(
  "7459155630639230",
  "516928863504564641",
  "211174979526423",
  "138345019798768245",
  "628674429278140341",
  "12244230231891557",
  "1103733821219708964",
  "391883605098562882",
  "332210910034442829",
  "154389093484135140"
)

$root = Split-Path -Parent $PSScriptRoot
$output = Join-Path $root "output\references\pinterest"
New-Item -ItemType Directory -Path $output -Force | Out-Null

function Get-MetaContent([string]$html, [string]$property) {
  foreach ($match in [regex]::Matches($html, '<meta\s+[^>]*>', 'IgnoreCase')) {
    $tag = $match.Value
    if ($tag -notmatch ('(?:property|name)=["'']' + [regex]::Escape($property) + '["'']')) { continue }
    if ($tag -match 'content=["''](?<value>.*?)["'']') {
      return [System.Net.WebUtility]::HtmlDecode($Matches.value)
    }
  }
  return $null
}

$manifest = foreach ($pin in $pins) {
  $url = "https://ca.pinterest.com/pin/$pin/"
  $response = Invoke-WebRequest -UseBasicParsing -Uri $url
  $html = $response.Content
  $title = Get-MetaContent $html "og:title"
  $imageUrl = Get-MetaContent $html "og:image"
  $videoUrl = Get-MetaContent $html "og:video"

  if (-not $imageUrl -or $imageUrl -notmatch 'pinimg\.com') {
    $poster = [regex]::Match($html, 'poster="(?<url>https://i\.pinimg\.com/[^"?]+)', 'IgnoreCase')
    if ($poster.Success) { $imageUrl = [System.Net.WebUtility]::HtmlDecode($poster.Groups['url'].Value) }
  }
  if (-not $videoUrl) {
    $video = [regex]::Match($html, 'src="(?<url>https://v\d+\.pinimg\.com/videos/[^"?]+\.(?:m3u8|mp4))', 'IgnoreCase')
    if ($video.Success) { $videoUrl = [System.Net.WebUtility]::HtmlDecode($video.Groups['url'].Value) }
  }
  $directVideo = [regex]::Match($html, 'https://v\d+\.pinimg\.com/videos/[^"''\\ ]+/expMp4/[^"''\\ ]+\.mp4', 'IgnoreCase')
  $directVideoUrl = if ($directVideo.Success) { [System.Net.WebUtility]::HtmlDecode($directVideo.Value) } else { $null }

  $imageFile = $null
  if ($imageUrl) {
    $extension = [IO.Path]::GetExtension(([Uri]$imageUrl).AbsolutePath)
    if (-not $extension) { $extension = ".jpg" }
    $imageFile = "$pin$extension"
    Invoke-WebRequest -UseBasicParsing -Uri $imageUrl -OutFile (Join-Path $output $imageFile)
  }

  $playlistFile = $null
  if ($videoUrl -and $videoUrl -match '\.m3u8(?:$|\?)') {
    $playlistFile = "$pin.m3u8"
    Invoke-WebRequest -UseBasicParsing -Uri $videoUrl -OutFile (Join-Path $output $playlistFile)
  }
  $videoFile = $null
  if ($directVideoUrl) {
    $videoFile = "$pin.mp4"
    Invoke-WebRequest -UseBasicParsing -Uri $directVideoUrl -OutFile (Join-Path $output $videoFile)
  }

  [pscustomobject]@{
    pin = $pin
    sourceUrl = $url
    title = $title
    imageUrl = $imageUrl
    imageFile = $imageFile
    videoUrl = $videoUrl
    directVideoUrl = $directVideoUrl
    videoFile = $videoFile
    playlistFile = $playlistFile
  }
}

$manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $output "manifest.json") -Encoding utf8
$manifest | Format-Table pin, title, imageFile, videoFile, playlistFile -AutoSize
