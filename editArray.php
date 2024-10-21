<?php
// POST 요청으로 전달된 데이터 받기
$filename = $_POST['filename'];
$contentToAdd = $_POST['contentToAdd'];
$contentToRemove = $_POST['contentToRemove'];

// 파일의 내용 읽기
$contents = file_get_contents($filename . '.txt');
$contentsArray = explode("
", $contents);

// 내용 제거
if($contentToRemove !== '') {
    // 내용이 존재하는지 확인 후 제거
    if(in_array($contentToRemove, $contentsArray)) {
        $index = array_search($contentToRemove, $contentsArray);
        unset($contentsArray[$index]);
    }
}

// 내용 추가
if($contentToAdd !== '') {
    // 내용이 이미 존재하는지 확인 후 추가
    if(!in_array($contentToAdd, $contentsArray)) {
        array_push($contentsArray, $contentToAdd);
    }
}

// 파일에 내용 쓰기
file_put_contents($filename . '.txt', implode("
", $contentsArray));
?>


