<?php
########################################
$APIKEY = "";
########################################
function post($url, $postdata){
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($curl, CURLOPT_POST, 1);
    curl_setopt($curl, CURLOPT_POSTFIELDS, $postdata);
    curl_setopt($curl, CURLOPT_CONNECTTIMEOUT_MS, 0);
    curl_setopt($curl, CURLOPT_HEADER, 0);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
    $res = curl_exec($curl);
    curl_close($curl);
    return $res;
};
function getData($source){
    $source = preg_replace("/[^0-9]/i", ".", $source);
    $detaArr = explode("...", $source);
    $data = "";
    foreach ($detaArr as $detaKey => $detaValue){
        if ($detaKey == (count($detaArr) - 2) || $detaKey == (count($detaArr) - 1)){
            $data .= $detaValue;
            break;
        }else{
            $data .= $detaValue.".";
        };
    };
    return $data;
}
$api = "https://api.ocr.space/parse/image";
$image = $_FILES['image'];
$imageData = file_get_contents($image['tmp_name'][0]);
$imageData = base64_encode($imageData);
$context = [
    'apikey' => $APIKEY,
    'base64Image' => 'data:image/png;base64,'.$imageData,
    'language' => 'chs',
    'filetype' => 'PNG'
];
$json = post($api, $context);
if (!@json_decode($json)){
    print_r(json_encode(['error' => true, 'msg' => $json]));
    exit;
};
$text = nl2br(json_decode($json, true)['ParsedResults'][0]['ParsedText']);
$textArr = explode("<br />", $text);
$times = 0;
$result['error'] == null;
foreach ($textArr as $key => $value){
    if ($times >= 4) break;
    if (!strstr($value, "+")) continue;
    $valueArr = explode("+", $value);
    if (strstr($valueArr[0], "暴击率")){
        $result['crit-p'] = getData($valueArr[1]);
    }elseif (strstr($valueArr[0], "暴击伤害")){
        $result['crit-d'] = getData($valueArr[1]);
    }elseif (strstr($valueArr[0], "元素精通")){
        $result['mastery'] = getData($valueArr[1]);
    }elseif (strstr($valueArr[0], "攻击力")){
        if (strstr($valueArr[1], "％")){
            $result['atk-p'] = getData($valueArr[1]);
        }else{
            $result['atk-n'] = getData($valueArr[1]);
        };
    }elseif (strstr($valueArr[0], "生命值")){
        if (strstr($valueArr[1], "％")){
            $result['hp-p'] = getData($valueArr[1]);
        }else{
            $result['hp-n'] = getData($valueArr[1]);
        };
    }elseif (strstr($valueArr[0], "防御力")){
        if (strstr($valueArr[1], "％")){
            $result['def-p'] = getData($valueArr[1]);
        }else{
            $result['def-n'] = getData($valueArr[1]);
        };
    }elseif (strstr($valueArr[0], "元素充能效率")){
        $result['recharge'] = getData($valueArr[1]);
    }else{
        continue;
    };
    $times += 1;
};
print_r(json_encode($result));
?>
