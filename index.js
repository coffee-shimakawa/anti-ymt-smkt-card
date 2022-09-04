console.log("index.js loaded");

async function sha256(str) {
	// Convert string to ArrayBuffer
	const buff = new Uint8Array([].map.call(str, (c) => c.charCodeAt(0))).buffer;
	// Calculate digest
	const digest = await crypto.subtle.digest('SHA-256', buff);
	// Convert ArrayBuffer to hex string
	// (from: https://stackoverflow.com/a/40031979)
	return [].map.call(new Uint8Array(digest), x => ('00' + x.toString(16)).slice(-2)).join('');
}

const ErrorMsg = msg => {
	$("span#ErrorMessage").text(msg);
	setTimeout(() => {$("span#ErrorMessage").text("")}, 1000*10);
	return;
}

// const make_cookie = () => {
// 	// クッキー
// 	let tmp = [document.res.split("; "), []];
// 	let res = {}
// 	for (let i = 0; i < tmp[0].length; i++) {
// 		tmp[1] = tmp[0][i].split("=");
// 		res[tmp[1][0]] = tmp[1].slice(1).join("=");
// 	}
// 	return res;
// }
// var cookie = make_cookie();

const RunGAS = (dict={}, doneFunc=() => {}, opt={}) => {
	if (opt) {
		let options = {
			loadName: (opt.loadName != undefined) ? opt.loadName : dict.mode,
			stopError: (opt.stopError != undefined) ? opt.stopError : true
		}
	}
	let gid = "AKfycbw19veSGukPMIL2265Y-W-Hm5rhCPip8Lh9OKRDQk4tB86-cc2LDXi13lkY1t1wgOIsxg";
	let code = "";
	for (let key in dict) {
		code += key + "=" + dict[key] + "&";
	}
	code = code.slice(0, -1);
	$.ajax(`https://script.google.com/macros/s/${gid}/exec?${code}`, "post")
	.done(data => {
		console.log(dict.mode + " data Loaded");
		console.log(data.return);
		if (!data.return[0]) {
			// if (data.return[1].slice(0, 1) == "E" && options.stopError) { console.log(options.loadName + ": " + data.return); return; }
			console.log(data.return[1]);
			ErrorMsg({P: "パスワードが違います", ID: "IDが存在しません"}[data.return[1].split("_")[1]]);
			if (dict.mode == "load") {
				$("button#send").prop("disabled", false);
			}
			return data.return[1];
		}
		doneFunc(data.return);
	})
	.fail(function (data) {
		console.log(options.loadName + " can't Loaded");
		document.title = "GAS Error";
		console.log(data);
	})
}

/*
Sheet:
	[No, Pass, Name1\n名前1, Name2\n名前2, Name3\n名前3, ...]
data = {
	mode: str,
	number: int,
	name: str,
	password: str,
}

Save(mode, name, password)
Load(mode, number, password)
Change(mode, number, password, [name])
*/

let scale = 1;
const make_card = names => {
	$("div#card_data").show();
	let canvas = $("canvas#card")[0];
	let ctx = canvas.getContext('2d');
	let img = new Image();
	img.src = 'demo.jpg';
	img.onload = () => {
		ctx.save();
		ctx.scale(scale, scale);
		// 画像
		ctx.drawImage(img, 0, 0, 1080, 1410);
		// 埋め込め
		ctx.beginPath();
		ctx.fillStyle = "#FFFFFF";
		ctx.rect(715, 565, 245, 35); // ID
		ctx.rect(325, 555, 200, 35); // 名前
		ctx.fill();
		// テキスト
		ctx.fillStyle = "#000000";
		ctx.font = '35px arial';
		ctx.fillText(card_number, 718, 596);
		ctx.font = '40px arial';
		ctx.fillText(names, 337, 590);
		ctx.restore();
		$("a#link").attr({href: $("canvas#card")[0].toDataURL('image/png', 0.85), download: `${card_number}_${names}.png`})
	}
}

let restoreHTML = "";
let card_number = "";
const make_list = (data) => {
	$("div#data").show();
	card_number = ("0000000000" + String(data[0])).slice(-10);
	$("span#your_id").text(`あなたのIDは ${card_number} です`);
	let names = data.slice(2);
	$("ul#names").html("");
	for (let i = 0; i < names.length; i++) {
		$("<li>").appendTo("ul#names")
				.html(`<input type="text" class="name1 nameI" placeholder="Name" value="${names[i]}"><br>
					<button class="delete">削除</button><button class="make_card" card_name="${names[i]}">カード</button>`)
				.addClass("name")
		$("button.make_card").click(e => make_card($(e.target).attr("card_name")) );
		$("input.nameI").change(e => {$(e.target).attr("value", e.target.value); changeE()} );
		$("button.delete").click(e => {e.target.parentNode.outerHTML = ""; changeE()});
	}
	restoreHTML = $("ul#names").html();
	$("button#send").prop("disabled", false);
}
const changeE = () => { $("button#change,button#restore").prop("disabled", ($("ul#names").html() == restoreHTML)) };

const not_accepted = ["\\", "&", "=", "\"", "\'", "\`", "/"];
$(() => {
	// 初期設定
	$("canvas#card").prop({height: 1410*scale, width: 1080*scale});
	$("div#data").hide();
	$("button#change,button#restore").prop("disabled", true);
	$("div#card_data").hide();
	// イベント
	$("select#mode").change(e => {
		switch (e.target.value) {
			case "save":
				$("div#input").children("input").prop("disabled", false);
				$("input#number").prop("disabled", true);
				break;
			case "load":
				$("div#input").children("input").prop("disabled", false);
				$("input#name1").prop("disabled", true);
				break;
			case "allLoad":
				$("div#input").children("input").prop("disabled", true);
				$("input#password").prop("disabled", false);
				break;
		}
	})
	$("button#send").click(e => {
		$("div#data").hide();
		$("div#data").children().show();
		$("button#change,button#restore").prop("disabled", true);
		$("div#card_data").hide();
		$(e.target).prop("disabled", true);
		switch ($("select#mode").val()) {
			case "save":
				if ($("input#password").val() == "" || $("input#name1").val() == "") {
					ErrorMsg("未記入の欄があります");
					return;
				}
				for (let i = 0; i < not_accepted.length; i++) {
					if ($("input#name1").val().indexOf(not_accepted[i]) != -1) {
						ErrorMsg(`許可されていない文字列(${not_accepted.join(" ")})のいずれかが、名前に含まれています`);
						return;
					}
					if ($("input#password").val().indexOf(not_accepted[i]) != -1) {
						ErrorMsg(`許可されていない文字列(${not_accepted.join(" ")})のいずれかが、パスワードに含まれています`);
						return;
					}
				}
				(async () => {
					const pass = await sha256($("input#password").val());
					RunGAS({mode: "save", name: $("input#name1").val(), password: pass}, (data) => {
						make_list(data);
						$("select#mode").val("load");
						$("input#number").val(data[0]).prop("disabled", false);
						$("input#name1").prop("disabled", true);
					});
				})();
				break;
			case "load":
				if ($("input#password").val() == "" || $("input#number").val() == "") {
					ErrorMsg("未記入の欄があります");
					return;
				}
				for (let i = 0; i < not_accepted.length; i++) {
					if ($("input#password").val().indexOf(not_accepted[i]) != -1) {
						ErrorMsg(`許可されていない文字列(${not_accepted.join(" ")})のいずれかが、パスワードに含まれています`);
						return;
					}
				}
				(async () => {
					const pass = await sha256($("input#password").val());
					RunGAS({mode: "load", number: $("input#number").val(), password: pass}, (data) => {
						make_list(data);
					});
				})();
				break;
			case "allLoad":
				if ($("input#password").val() == "") {
					ErrorMsg("未記入の欄があります");
					return;
				}
				for (let i = 0; i < not_accepted.length; i++) {
					if ($("input#password").val().indexOf(not_accepted[i]) != -1) {
						ErrorMsg(`許可されていない文字列(${not_accepted.join(" ")})のいずれかが、パスワードに含まれています`);
						return;
					}
				}
				(async () => {
					const pass = await sha256($("input#password").val());
					RunGAS({mode: "allLoad", password: pass}, (data) => {
						$("div#data").show();
						$("div#data").children().hide();
						$("ul#names").show().html("");
						for (let j = 0; j < data.length; j++) {
						    let names = data[j].slice(2);
						    for (let i = 0; i < names.length; i++) {
						    	$("<li>").appendTo("ul#names")
									.html(`<span class="name1 nameI">${names[i]}</span><br><button class="make_card" card_number="${data[j][0]}" card_name="${names[i]}">カード</button>`)
									.addClass("name");
						    	$("button.make_card").click(e => {card_number = ("0000000000" + $(e.target).attr("card_number")).slice(-10); make_card($(e.target).attr("card_name").split("\\n"))} );
							}
							// $("ul#names").children().slice(-1).addClass("br_");
							// $("<br>").appendTo("ul#names");
							$("<div>").appendTo("ul#names").css("width", "100%");
						}
						$("button#send").prop("disabled", false);
					});
				})();
				break;
		}
	})
	$("button#add").click(e => {
		$("<li>").appendTo("ul#names")
				.html(`<input type="text" class="name1 nameI" placeholder="名前"><br><button class="delete">削除</button>`)
				.addClass("name")
		// $("button.make_card").click(e => make_card($(e.target).attr("card_name").split("\\n")) );
		$("input.nameI").change(e => {$(e.target).attr("value", e.target.value); changeE()} );
		$("button.delete").click(e => {e.target.parentNode.outerHTML = ""; changeE()});
		changeE();
	})
	$("button#change").click(e => {
		$("button").prop("disabled", true);
		(async () => {
			let check_flag = true;
			// 確認
			if ($("ul#names").children().children("input").length == 0) {
				ErrorMsg("名前が何もありません");
				check_flag = false;
			}
			$("ul#names").children().children("input").each((ind, item) => {
				if (item.value == "") {
					ErrorMsg("空白の欄があります");
					check_flag = false;
					return;
				}
				for (let i = 0; i < not_accepted.length; i++) {
					if (item.value.indexOf(not_accepted[i]) != -1) {
						ErrorMsg(`許可されていない文字列(${not_accepted.join(" ")})のいずれかが、名前に含まれています`);
						check_flag = false;
						return;
					}
				}
			})
			// 変更作業
			if (!check_flag) {
				$("button").prop("disabled", false);
				return;
			}
			let names_list = [];
			$("ul#names").children().children("input").each((ind, item) => {
				names_list.push(item.value);
			})
			const pass = await sha256($("input#password").val());
			// console.log(names_list);
			RunGAS({mode: "change", number: $("input#number").val(), password: pass, name: names_list.join("\\\\")}, (data) => {
				make_list(data);
				$("button").not("#change").prop("disabled", false);
				changeE();
			})
		})();
	})
	$("button#restore").click(e => {
		$("ul#names").html(restoreHTML);
		$("button.make_card").click(e => make_card($(e.target).attr("card_name").split("\\n")) );
		$("input.nameI").change(e => {$(e.target).attr("value", e.target.value); changeE()} );
		$("button.delete").click(e => {e.target.parentNode.outerHTML = ""; changeE()});

		$("button#change,button#restore").prop("disabled", true);
	})
	// パスワード
	$("button#SetPassword").click(e => {
		if ($("button#NewPassword").val() == "") {
			return;
		}
		(async () => {
			const old_pass = await sha256($("input#OldPassword").val());
			const new_pass = await sha256($("input#NewPassword").val());
			RunGAS({mode: "changepass", number: $("input#number").val(), password: old_pass, npassword: new_pass}, (data) => {
				console.log("Changed");
				window.alert("パスワード変更しました\nページをリロードします");
				window.location.reload(1);
			})
		})();
	})
})
