<?php
    if(isset($_GET['filename'])){
        $filename = $_GET['filename'];
        $file = file_get_contents($filename.".txt");
        $lines = explode(PHP_EOL, $file); // 줄별로 분리하여 배열 생성
        echo json_encode($lines);
    }
?>