var request = require('request');
var cheerio = require('cheerio');

var resultsURL = "http://play.eslgaming.com/rainbowsix/north-america-pc/r6siege/major/5on5-pro-league-season-2-north-america/results/";
var base = "http://play.eslgaming.com";

var teamMembers = [];
function getMatches() {
	request(resultsURL, function(err, response, body){


		if(!err){

			var $ = cheerio.load(body);
			var arr = [];

			$(".esl-content table td:nth-child(2),.esl-content table td:nth-child(3)").each(function(i,e) {
				arr.push({
					text: $(e).text().trim(),
					ref: $(e).parent().attr('onclick').split("'")[1]
				})
			})

			var uniq = [];

			for (var i in arr) {
				var name = arr[i].text;

				var found = false;
				for (var a in uniq) {
					if (uniq[a].text === name) {
						found = true;
						break;
					}
				}

				if (found) continue;

				uniq.push(arr[i]);
			}
			var done = [];
			var memberLinks = [];
			WaterfallOver(uniq, function(team, report) {
				var ref = team.ref;
				request(base + ref, function(err, res, body) {
					$ = cheerio.load(body);

					$(".esl-content table a[href*=members]").map(function() {
						var link = $(this).attr('href');

						var name = $($(this).parent().children()[0]).text().trim();

						memberLinks.push({link: link, name: name});

					})
					report();

				});
			}, function() {
				var clean = [];

				for (var i in memberLinks) {
					var name = memberLinks[i].name;

					var found = false;
					for (var a in clean) {
						if (clean[a].name === name) {
							found = true;
							break;
						}
					}

					if (found) continue;

					clean.push(memberLinks[i]);
				}

				WaterfallOver(clean, getMembers, function() {
					var rp = "";

					for (var t in teamMembers) {
						var team = teamMembers[t];

						var members = team.members;
						var name = team.name;

						rp += "**" + name + "**\n\n";

						for (var m in members) {
							var member = members[m];
							rp += "[" + member.esl + "](https://r6stats.com/stats/uplay/" + member.username +")\n\n";
						}

					}

					console.log("Final Report:\n\n", rp);
				});
			})


		}
	});

}


function getMembers(data, report) {
	var name = data.name;
	var link = data.link;

	request(base + link, function(err, res, body) {
		if (err) return;
		$ = cheerio.load(body);

		var rows = $(".esl-content table").first().children().filter("[bgcolor='#E3E0DD'],[bgcolor='#F5F4F3']");
		var members = [];
		rows.each(function(i,e) {
			var platformName = $(e).find("div:contains('Uplay Nick')").clone().children().remove().end().text().replace('Uplay Nick:', '').trim();
			var eslName = $(e).find("b").text();
			members.push({esl: eslName, username: platformName});
		});

		teamMembers.push({name: name, members: members})
		report();
	})
}

function WaterfallOver(list, iterator, callback) {

	var nextItemIndex = 0;

	function report() {

		nextItemIndex++;

		if (nextItemIndex === list.length) {

			callback();
		} else {
			iterator(list[nextItemIndex], report);
		}
	}

	iterator(list[0], report);
}

getMatches();