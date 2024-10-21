var uploadedFile; // 이미지 파일 객체를 저장하기 위한 전역 변수 선언
var barcodeNumber; // 바코드 번호를 전달해주기 위한 전역 변수 선언

/***** 1. 파일 업로드 함수 *****/
function loadFile(event) {
    var output = document.getElementById('preview');
    output.src = URL.createObjectURL(event.target.files[0]);
    uploadedFile = event.target.files[0]; // 이미지 파일 객체 저장
    output.onload = function () {
        URL.revokeObjectURL(output.src);
        recognizeBarcode(uploadedFile); // 바코드 인식
        performOcr(uploadedFile); // OCR 수행
    }
    output.style.display = 'block';
}

/***** 2-1. 바코드 인식 함수 *****/
const recognizeBarcode = (file) => {
    Quagga.decodeSingle({
        src: URL.createObjectURL(file),
        decoder: {
            readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader", "code_39_vin_reader", "codabar_reader", "upc_reader", "upc_e_reader", "i2of5_reader", "2of5_reader", "code_93_reader"]
        }
    }, (result) => {
        if (result) {
            generateBarcode(result);
        }
    });
}
/***** 2-2. 바코드 재생성 함수 *****/
const generateBarcode = (item) => {
    try {
        const value = item.codeResult.code;
        const format = item.codeResult.format;
        let format2 = format.replace(/_/g, "");
        bwipjs.toCanvas("barcode", {
                bcid : format2,
                text : value,
                scale : 3,
                height : 10,
                includetext : true,
                textalign : "center"
        });
        barcodeNumber = value.toString();
        document.getElementById('barcode').style.display = 'block';
        document.getElementById('barcodeNumber').style.display = 'none';
        document.getElementById('barcodeNumberInput').style.display = 'none';
        document.getElementById('barcodeNumberSubmit').style.display = 'none';
    } catch (error) {
        console.log("Barcord Detached Error :: " + error.message);
        document.getElementById('barcode').style.display = 'none';
        document.getElementById('barcodeNumber').style.display = 'block';
        document.getElementById('barcodeNumberInput').style.display = 'block';
        document.getElementById('barcodeNumberSubmit').style.display = 'block';
    }
}
/***** 2-3. 문자열을 통한 바코드 재생성 함수 *****/
const generateBarcodeFromInput = () => {
const barcodeNumber = document.getElementById('barcodeNumberInput').value.toString();
    try {
        //JsBarcode("#barcode", barcodeNumber);
        bwipjs.toCanvas("barcode", {
                bcid : 'code128',
                text : barcodeNumber,
                scale : 3,
                height : 10,
                includetext : true,
                textalign : "center"
        });
        document.getElementById('barcode').style.display = 'block';
        document.getElementById('barcodeNumber').style.display = 'none';
        document.getElementById('barcodeNumberInput').style.display = 'none';
        document.getElementById('barcodeNumberSubmit').style.display = 'none';
    } catch (error) {
        console.log("Barcord Generation Error :: " + error.message);
    }
};

/***** 3. clovaOCR 사용 함수 (ocr.php) *****/
function performOcr(file) {
    var form = new FormData();
    form.append('fileToUpload', file);

    fetch('/ocr.php', {
        method: 'POST',
        body: form
    }).then(function (response) {
        return response.json(); // 응답을 JSON으로 변환
    }).then(function (data) {
        recognizeText(data);
    }).catch(function (error) {
        console.error(error);
    });
}

/***** 4. 교환처, 유효기간, 상품명 등 정보 추출 함수 *****/
async function recognizeText(text) {
    let remainingArray = text;

    console.log("배열: ", remainingArray);

    // 교환처 가져오기
    let exchangePlaces = await getArray('ExchangeLocationArray'); // 받아온 데이터를 exchangePlaces 배열에 저장
    console.log(exchangePlaces);

    let places = []; // 여러 개의 교환처를 저장할 배열
    let placeIndex;

    for (let placeName of exchangePlaces) {
        let tempString;
        let tempArray = [];
        for (index in remainingArray) {
            tempString = remainingArray[index].toLowerCase();
            tempString = tempString.replace(/\s/g, ''); // 모든 공백 제거
            tempArray.push(tempString);
        }
        placeIndex = tempArray.findIndex(element => element.includes(placeName.toLowerCase()));
        if (placeIndex !== -1) {
            places.push(placeName); // 포함된 교환처 이름을 배열에 추가
        }
    }

    // 유효기간 가져오기
    let expirationDate = [];

    for (item of remainingArray) {
        let TempDate = item.match(/\d{4}\s?년\s?\d{1,2}\s?월\s?\d{1,2}\s?일|\d{4}\s?\.\s?\d{1,2}\s?\.\s?\d{1,2}|\d{4}\s?\-\s?\d{1,2}\s?\-\s?\d{1,2}|\d{2}\s?년\s?\d{1,2}\s?월\s?\d{1,2}\s?일|\d{2}\s?\-\s?\d{1,2}\s?\-\s?\d{1,2}/);
        if (TempDate) {
            expirationDate.push(TempDate);
            console.log("날짜! : ", TempDate);
        }
    }

    let expirationTime = remainingArray.find(element => element.match(/\d{1,2}\s?시\s?\d{1,2}\s?분|\d{1,2}\s?\:\s?\d{1,2}/));
    let expirationPhoneNumber = remainingArray.find(element => element.match(/\d{4}\s?\-\s?\d{4}|\d{3}\s?\-\s?\d{4}\s?\-\s?\d{4}|\d{2}\s?\-\s?\d{4}\s?\-\s?\d{4}/));

    var dateStringFormatted;
    var dateControlValue = 0;

    var invalidDates = []; // 유효기간이 아닌 날짜를 저장할 배열 선언
    for (item of expirationDate) {
        var regex = /(?:(\d{4})\s?년\s?|(\d{4})\s?\.\s?|(\d{4})\s?\-\s?|(\d{2})\s?년\s?|(\d{2})\s?\-\s?|(\d{2})\s?)(\d{2})\s?(?:월|\.|\-)?\s?(\d{2})\s?(?:일|\.|\-)?/;
        var match = regex.exec(item);

        var year = Number(match[1] || match[2] || match[3] || match[4] || match[5] || match[6]);
        if (year < 100) {
            year += 2000;
        }
        var month = Number(match[7]) - 1;
        var day = Number(match[8]);
        var dateObject = new Date(year, month, day);
        var yearString = dateObject.getFullYear();
        var monthString = (dateObject.getMonth() + 1).toString().padStart(2, "0");
        var dayString = dateObject.getDate().toString().padStart(2, "0");

        let dateCompareValue = parseInt(yearString + monthString + dayString);
        if (dateControlValue < dateCompareValue) {
            dateControlValue = dateCompareValue;
            dateStringFormatted = yearString + "-" + monthString + "-" + dayString;
            console.log('유효기간 : ' + dateStringFormatted);
        }
        else {
            console.log(dateCompareValue, "Is Not Date");
            invalidDates.push(item); // 유효기간이 아닌 날짜를 배열에 추가
        }
    }

    remainingArray = remainingArray.filter(element => {
        // 'invalidDates' 배열에 있는 모든 요소가 'element'에 포함되지 않는지 확인
        return !invalidDates.some(invalidDate => element.includes(invalidDate));
    }); // 다른기간 포함 배열 삭제
    remainingArray = remainingArray.filter(element => !element.includes(expirationDate)); // 유효기간 포함 배열 삭제
    remainingArray = remainingArray.filter(element => !element.includes(expirationTime)); // 시간 포함 배열 삭제
    remainingArray = remainingArray.filter(element => !element.includes(expirationPhoneNumber)); // 전화번호 포함 배열 삭제
    remainingArray = remainingArray.filter(element => !/\d{7,}/.test(element)); // 1,000,000 이상의 숫자 포함 배열 삭제

    let FinalArray = [];

    remainingArray.forEach(item => {
        const line = item.replace(/[^\w가-힣\s\.\+]|_/g, ""); // 모든 특수기호 제거

        if (line.trim().length > 1) {
            FinalArray.push(line);
        }
    });

    let elementsToRemove = await getArray('ExceptionArray'); // 받아온 데이터를 elementsToRemove 배열에 저장
    FinalArray = await removeElements(FinalArray, elementsToRemove.concat([barcodeNumber]));

    // 최종적으로 남은 배열의 마지막 배열(앞줄에 인식 못하는 문자열들이 열거 될 가능성 있음)
    let Product = "";
    if (Product === "") {
        Product = FinalArray.join(" ");

        for (let place of exchangePlaces) {
            Product = removeExchangeLocation(Product, "" + place);
        }

        let ProductArray = Product.split(" ");

        let RapTime = 0;

        for(let i = 0; i < ProductArray.length; i++) {
            for(let j = i+1; j < ProductArray.length; j++) {
                // j번째 문자열에 i번째 문자열이 포함되어 있으면
                if(ProductArray[j].includes(ProductArray[i])) {
                    RapTime++;
                    // i번째 요소를 제거
                    ProductArray = ProductArray.filter((_, index) => index !== i);

                    console.log("RapTime:", RapTime, ProductArray);
                }
            }
        }

        Product = ProductArray.join("");

        const BarcodeRegex = /\d{10,}/g;

        // 정규 표현식을 사용하여 문자열에서 숫자 찾기
        const BarcodeMatches = Product.match(BarcodeRegex);

        // 찾은 숫자가 있다면 출력
        if (BarcodeMatches) {
            console.log("인식못한바코드: ", BarcodeMatches);
            Product = removeExchangeLocation(Product, "" + BarcodeMatches);
            document.getElementById('barcodeNumberInput').value = BarcodeMatches;
        }
        //FinalArray = await removeElements(FinalArray, elementsToRemove.concat([BarcodeMatches]));

        // 최종배열 가져오기
        console.log('최종배열:\t', FinalArray);

        let finalExceptionToRemove = await getArray('AnotherExceptionArray'); // 받아온 데이터를 배열에 저장
        for (let finalException of finalExceptionToRemove) {
            Product = removeExchangeLocation(Product, "" + finalException);
        }

        if (places.length > 0) {
            console.log('Exchange_Location:', places.slice(0, 2).join(' || ')); // 최대 두 교환처만 출력
        }
        console.log('교환처:\t', places[0]);
        console.log('유효기간:\t', dateStringFormatted);
    }
    console.log("최종상품명:\t", Product);


    const keywords = ["ice", "hot", "short", "tall", "regular", "standard", "free", "grande", "large", "venti", "extra", "trenta"];
    //상품명 포맷 함수
    function transformString(inputString) {
        let string;
        const transformedWords = [];
    
        for (const keyword of keywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, "gi");
            if (regex.test(inputString)) {
                string = inputString.replace(regex, "");
                transformedWords.push(keyword);
            }
        }
    
        let transformedString = string.trim();
    
        if (transformedWords.length > 0) {
            transformedString += `-${transformedWords.join("-")}`;
        }
        
        return transformedString;
    }

    //상품명 포맷
    let transformedString = "";
    let productLower=Product.toLowerCase();
    if (keywords.some(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, "gi");
        return regex.test(productLower);
    })) {
        transformedString = transformString(productLower);
        console.log('포맷상품명:\t', transformedString);
    }

    // 이미지가 로드되면 submit 버튼을 활성화
    document.getElementById('submit').disabled = false;
    document.getElementById('product_name').value = Product;
    document.getElementById('exchange_location').value = places[0];
    document.getElementById('expiration_date').value = dateStringFormatted;
}

/***** 5. 리스트 가져오기 함수 (callArray.php) *****/
async function getArray(filename) {
    let response = await fetch('/callArray.php?filename=' + filename, {
        method: 'GET',
    });

    let data = await response.json(); // 응답을 JSON으로 변환
    return data; // 변환된 JSON을 반환
} // 사용 : getArray('ExchangeLocationArray/ExceptionArray/AnotherExceptionArray')

/***** 6. 교환처 제거 함수 *****/
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $&는 일치하는 전체 문자열을 의미합니다.
}
function removeExchangeLocation(originalString, stringToRemove) {
    let noSpaceOriginalString = originalString.replace(/\s/g, "");
    let noSpaceToRemove = escapeRegExp(stringToRemove.replace(/\s/g, ""));
    let regex = new RegExp(noSpaceToRemove, "gi"); 
    let result = originalString.replace(regex, '');
    return result.length > 0 ? result.trim() : ""; 
}

/***** 7. remainingArray 여러요소 한번에 제거 *****/
async function removeElements(remainingArray, elements) {
    for (let element of elements) {
        remainingArray = SpliceArray(remainingArray, element);
    }

    return remainingArray;
}

/***** 8. 예외기반 텍스트 제거 *****/
function SpliceArray(controlValue, experimentalValue) {
    if (!experimentalValue) {
        return controlValue;
    }

    let filter = experimentalValue.toString();
    let result = ProbabilisticStringSelector(controlValue, filter);

    console.log("--" + filter + "--");
    console.log(result.sortedControl);
    console.log(result.sortedCounts);
    console.log(result.indices);
    console.log(result.ProbabilisticSelector);
    console.log("--" + filter + "--");

    if (result.ProbabilisticSelector === null) {
        console.log("해당 문자열은 존재하지 않습니다")
        return controlValue;
    }

    // 배열에서 요소를 삭제할 때는 역순으로 삭제해야 합니다.
    for (let i = result.ProbabilisticSelector.length - 1; i >= 0; i--) {
        let index = result.ProbabilisticSelector[i];
        controlValue.splice(index, 1);
    }
    // 재귀호출 부분
    return SpliceArray(controlValue, experimentalValue);
}

/***** 9. 문자열 유사도 측정 후 인덱스 정렬 및 반환 *****/
function ProbabilisticStringSelector(controlValue, experimentalValue) {
    let weight = 2;
    let wordCounts = controlValue.map(stringValue => {
        let count = 0;
        let foundIndex = 0;
        let foundCound = 1;
        let wordsInControl = stringValue.split('');
        let wordsInExperimental = experimentalValue.split('');

        for (let wordInControlSplited of wordsInControl) {
            if (wordInControlSplited === ' ')
                continue;

            // 한글이 아닌 경우 소문자로 변환
            if (!/^[\uac00-\ud7a3]*$/.test(wordInControlSplited)) {
                wordInControlSplited = wordInControlSplited.toLowerCase();
            }


            for (let j=foundIndex; j<wordsInExperimental.length; j++) {
                if (wordsInExperimental[j] === ' ')
                    continue;

                // 한글이 아닌 경우 소문자로 변환
                if (!/^[\uac00-\ud7a3]*$/.test(wordsInExperimental[j])) {
                    wordsInExperimental[j] = wordsInExperimental[j].toLowerCase();
                }

                if (wordsInExperimental[j] === wordInControlSplited) {
                    count += Math.pow(Math.pow(2, weight), foundCound);
                    foundIndex = j+1;
                    foundCound += 1;
                    break;
                }
                else {
                    foundIndex = 0;
                    if( !count < 0 )
                        count--;   
                    foundCound = 1;
                    continue;
                }
            }
        }
        return count;
    });

    let indices = Array.from(Array(wordCounts.length).keys());
    indices.sort((a, b) => wordCounts[b] - wordCounts[a]);

    let sortedControl = indices.map(index => controlValue[index]);
    let sortedCounts = indices.map(index => wordCounts[index]);

    // 확률 값 중 가장 큰 값을 찾습니다.
    let maxCount = Math.max(...sortedCounts);

    // 가장 큰 확률 값을 가진 인덱스들만 선택합니다.
    let ProbabilisticSelector = sortedCounts
        .map((value, index) => value === maxCount ? indices[index] : -1)
        .filter(index => index !== -1);

    // experimentalValue 보다 큰 maxCount가 없으면 null을 반환합니다.
    if (maxCount < (Math.pow(3, experimentalValue.length))) {
        ProbabilisticSelector = null;
    }

    return { sortedControl, sortedCounts, indices, ProbabilisticSelector };
}