    <?php
    if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_FILES['fileToUpload']) && $_FILES['fileToUpload']['error'] == UPLOAD_ERR_OK) {
        $client_secret = "";
        $url = "";
        $image_file = $_FILES['fileToUpload']['tmp_name'];

        $params = new stdClass();
        $params->version = "V2";
        $params->requestId = uniqid();
        $params->timestamp = time();

        $image = new stdClass();
        $image->format = "jpg";
        $image->name = "demo";

        $images = array($image);
        $params->images = $images;
        $json = json_encode($params);

        $is_post = true;
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, $is_post);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $post_form = array("message" => $json, "file" => new CURLFILE($image_file));
        curl_setopt($ch, CURLOPT_POSTFIELDS, $post_form);
        $headers = array();
        $headers[] = "X-OCR-SECRET: ".$client_secret;
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        $response = curl_exec($ch);
        $err = curl_error($ch);
        $status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close ($ch);

        if ($status_code == 200) {
            $response_arr = json_decode($response, true); // 응답을 PHP 배열로 변환
            $new_arr = []; // 새로운 배열 생성
            $current_line = ""; // 현재 줄의 텍스트를 저장할 변수 생성
            foreach ($response_arr['images'] as $image) {
                foreach ($image['fields'] as $field) {
                    $current_line .= $field['inferText']; // 'inferText'를 현재 줄에 추가
                    if (isset($field['lineBreak']) && $field['lineBreak']) { // 'lineBreak'가 설정되어 있고 참이면
                        array_push($new_arr, $current_line); // 현재 줄을 새 배열에 추가
                        $current_line = ""; // 현재 줄 초기화
                    } else { // 'lineBreak'가 거짓이거나 설정되어 있지 않으면
                        $current_line .= " "; // 현재 줄에 공백 추가
                    }
                }
            }
            if ($current_line !== "") { // 마지막 줄 처리
                array_push($new_arr, $current_line);
            }
            // 새로운 배열 출력
            // echo "<pre>";
            // print_r($new_arr);
            // echo "</pre>";

            echo json_encode($new_arr);

        } else {
            echo $status_code . " ERROR";
        }
    }
    ?>