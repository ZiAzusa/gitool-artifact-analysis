function start() {
    $().setChr();
    $().showOCR();
}
function setdata(where, id) {
    $().setEntry(where, id, null);
}
function uploadImage(where, obj) {
    $().useOCR(where, obj);
}
function openDemo() {
    var imgLayer = document.getElementById("imgLayer");
    var imgBoxl = document.getElementById("imgBoxl");
    imgLayer.style.display = "block";
    imgBoxl.style.display = "block";
    imgSg();
}
function closeDemo() {
    var imgLayer = document.getElementById("imgLayer");
    var imgBoxl = document.getElementById("imgBoxl");
    imgLayer.style.display = "none";
    imgBoxl.style.display = "none";
}
function imgSg() {
    var img = document.getElementById("bigimg");
    var imgw = img.naturalWidth;
    var imgh = img.naturalHeight;
    var userw = document.body.clientWidth;
    var userh = document.body.clientHeight;
    if (imgw >= (userw * 0.8) && imgh <= (userh * 0.8)) {
        img.style.width = "80%";
        img.style.height = "auto";
    } else if (imgh >= (userh * 0.8)) {
        img.style.width = "auto";
        img.style.height = "80%";
    } else {
        img.style.width = "auto";
        img.style.height = "auto";
    }
}
//jQuery部分
$(function() {
    items = ['flower', 'feather', 'clock', 'cup', 'head'];
    ids = [1, 2, 3, 4];
    var powerdata = $.ajax({
        type: "get",
        url: "data.json",
        async: false,
        dataType: 'json'
    });
    var power = powerdata.responseJSON;
    $.fn.setChr = function() {
        chrlist = power['chr'];
        for (var chrname in chrlist) {
            $("#chr-list").append('<option id=' + chrname + ' value=' + chrname + '>' + chrname + '</option>');
        }
    }
    $.fn.setEntry = function(where, id, value) {
        entry = $('#' + where + '-' + id + ' option:selected').val();
        if (entry == "crit-p" || entry == "crit-d" || entry == "atk-p" || entry == "hp-p" || entry == "def-p" || entry == "recharge") {
            $("#" + where + "-" + id + "d").html("<input id='" + where + "-" + id + "n' type='text' placeholder='无需填写%号'>");
        } else if (entry == "empty") {
            $("#" + where + "-" + id + "d").html("<br>");
        } else {
            $("#" + where + "-" + id + "d").html("<input id='" + where + "-" + id + "n' type='text'>");
        }
        if (value != null) {
            $('#' + where + '-' + id + 'n').val(value);
        }
    }
    $.fn.showOCR = function() {
        if (power['ocr']['enable'] == true) {
            $("#ocr-title").css('display', 'block');
            for (var itemkey in items) {
                $("#" + items[itemkey] + "-ocr").html("<div style='background-color:rgba(255, 255, 255, 0.8);width:140px;font-size:15px;display:block'><span id='" + items[itemkey] + "-ocr-text'>图片识别</span> <input type='file' name='upload' id='" + items[itemkey] + "-upload' onchange=\"uploadImage('" + items[itemkey] + "', this)\" style='display:inline;width:70px' accept='.gif,.png,.jpg,.jpeg,.tiff,.bmp'></div>");
            }
        } else {
            for (var itemkey in items) {
                $("#" + items[itemkey] + "-ocr").html("<br>");
            }
        }
    }
    $.fn.useOCR = async function(where, obj) {
        $('#' + where + '-ocr-text').html('识别中…');
        var ext = $('#' + where + "-upload").val().split('.').pop().toLowerCase();
        if ($.inArray(ext, ['gif', 'png', 'jpg', 'jpeg', 'tiff', 'bmp']) == -1) {
            alert('请上传图片文件！您上传的文件类型为' + ext);
            $('#' + where + '-ocr-text').html('识别失败');
            return;
        }
        var files = obj.files;
        if (files[0].size > 1048576) {
            alert('请上传小于1MB的文件！您上传的文件大小为' + (files[0].size / 1048576).toFixed(2) + 'MB');
            $('#' + where + '-ocr-text').html('识别失败');
            return;
        }
        var formData = new FormData();
        for (var i = 0; i < files.length; i ++) {
            formData.append("image[]", files[i]);
        }
        await $.ajax({
            type: "post",
            url: "ocr.php",
            contentType: false,
            cache:false,
            processData: false,
            data: formData,
            success: function(rs) {
                json = JSON.parse(rs);
                if (json['error'] != null) {
                    alert('Error! Message: ' + json['msg']);
                    $('#' + where + '-ocr-text').html('识别失败');
                    return;
                }
                idkey = 1;
                for (var thisentry in json) {
                    $('#' + where + '-' + idkey).val(thisentry);
                    $.fn.setEntry(where, idkey, json[thisentry]);
                    idkey = idkey + 1;
                }
                $('#' + where + '-ocr-text').html('识别成功');
                $('#' + where + '-ocr-input').html("<input type='file' name='upload' id='" + where + "-upload' onchange=\"uploadImage('" + where + "', this)\" style='display:inline;width:70px' accept='.gif,.png,.jpg,.jpeg,.tiff,.bmp'>");
            }
        });
    }
    $("button[name=score]").on('click', function() {
        selectChr = $('#chr-list option:selected').val();
        if (selectChr == "empty") {
            chrlist[selectChr] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        }
        entrylist = power['entry'];
        chrlist = power['chr'];
        finalScore = 0;
        for (var itemkey in items) {
            if (items[itemkey] == 'head' && $('#head-0 option:selected').val() == "crit" && (chrlist[selectChr][0] != 0 || chrlist[selectChr][1] != 0)) {
                thisScore = 20;
            } else {
                thisScore = 0;
            }
            for (var idkey in ids) {
                nowScore = 0;
                entryName = $('#' + items[itemkey] + '-' + ids[idkey] + ' option:selected').val();
                entryData = $('#' + items[itemkey] + '-' + ids[idkey] + 'n').val();
                for (var entrykey in entrylist) {
                    if (entryName == entrylist[entrykey][1]) {
                        nowScore = entryData * entrylist[entrykey][2] * chrlist[selectChr][entrykey];
                        break;
                    }
                }
                thisScore = thisScore + nowScore;
            }
            finalScore = finalScore + thisScore;
            $('#' + items[itemkey] + '-score').html(thisScore.toFixed(2) + "分");
        }
        $('#final-score').html(finalScore.toFixed(2) + "分");
        if (finalScore <= 0) {
            $('#final-level').html("<p style='color:#000000'>Null</p>");
        } else if (finalScore > 0 && finalScore <= 35) {
            $('#final-level').html("<p style='color:#888888'>False</p>");
        } else if (finalScore > 35 && finalScore <= 70) {
            $('#final-level').html("<p style='color:#0000FF'>C</p>");
        } else if (finalScore > 70 && finalScore <= 105) {
            $('#final-level').html("<p style='color:#00FFFF'>B</p>");
        } else if (finalScore > 105 && finalScore <= 140) {
            $('#final-level').html("<p style='color:#00FF00'>A</p>");
        } else if (finalScore > 140 && finalScore <= 175) {
            $('#final-level').html("<p style='color:#FFFF00'>S</p>");
        } else if (finalScore > 175 && finalScore <= 210) {
            $('#final-level').html("<p style='color:#FF0000'>SS</p>");
        } else if (finalScore > 210) {
            $('#final-level').html("<p style='color:#000000'>SSS</p>");
        } else {
            $('#final-level').html("<p style='color:#000000'>NaN</p>");
        }
    });
});
