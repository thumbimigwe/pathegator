$(document).ready(function() {
/*This is a ton of script, mostly popups, so strap in for a wild ride!*/
/*endPom is the angle of the minute hand at which the work period will end.*/
		var endPom = 0;

/*the angle at which the break will end*/
		var endBreak = 0;

/*the number of cycles completed since beginning the session*/
		var totalPoms = 0;

/*what goal was set in the session begin popup. default one.*/
		var goalPoms = 1;

/*this is the beginning of the red progress tracking arc*/
		var pomBeginAngle = 0;
		var breakBeginAngle = 0;

/*how long to work in each cycle*/
		var pomLength = 25;

/*how long to break each cycle*/
		var breakLength = 5;

/*is it running?*/
		var pomRunning = false;
		var breakRunning = false;

/*This initializes the tooltip over "pomodoro" in the startup modal.*/
		$('[data-toggle="tooltip"]').tooltip();

/*this allows you to draw an arc around a circle in svg using only the polar coordinates.*/
		function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
				var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

				return {
						x: centerX + (radius * Math.cos(angleInRadians)),
						y: centerY + (radius * Math.sin(angleInRadians))
				};
		}

		function describeArc(x, y, radius, startAngle, endAngle) {

				var start = polarToCartesian(x, y, radius, endAngle);
				var end = polarToCartesian(x, y, radius, startAngle);

				var arcSweep = endAngle - startAngle <= 180 ? "0" : "1";

				var d = [
						"M", start.x, start.y,
						"A", radius, radius, 0, arcSweep, 0, end.x, end.y
				].join(" ");

				return d;
		}

/*the arcs around the clock get redrawn every second, as do the hands on the clock, thanks to this setInterval function. It runs every second.*/
		setInterval(function() {

/*this function rotates the hands of the clock based on the time.*/
				function r(el, deg) {
						el.setAttribute('transform', 'rotate(' + deg + ' 50 50)');
				}

/*we get the current time, and since there are 360 degrees around a circle, and 60 minutes in an hour, each minute is 360/60 = 6 degrees of rotation. multiply that by the number of minutes and add the seconds and their corresponding degree value and you get a minute hand that moves every second. Similar with the hour hand.*/
				var d = new Date();
				r(min, 6 * d.getMinutes() + d.getSeconds() / 10);
				r(hour, 30 * (d.getHours() % 12) + d.getMinutes() / 2);


				if (d.getMinutes() === 0 && d.getSeconds() < 5) {
						if (endPom >= 360) endPom -= 360;
						if (endBreak >= 360) endBreak -= 360;
				}

/*this function runs every second as the work period progresses.*/
				if (pomRunning) {

/*goes and draws the necessary arcs around the circle*/
						document.getElementById("progressArc")
								.setAttribute("d", describeArc(50, 50, 44, pomBeginAngle, endPom));
						document.getElementById("pomArc")
								.setAttribute("d", describeArc(50, 50, 44, 6 * d.getMinutes() + d.getSeconds() / 10, endPom));
						document.getElementById("breakArc")
								.setAttribute("d", describeArc(50, 50, 44, endPom, endBreak));

				}

/*this is the trigger to end the work period. it ends when the polar coodinates of the minute hand match the polar coodinates of the end of the work arc*/
				if ((6 * d.getMinutes() + d.getSeconds() / 10 >= endPom - 0.1 && 6 * d.getMinutes() + d.getSeconds() / 10 <= endPom + 0.1) && pomRunning) {

						pomRunning = false;

/*the bell to signify the end of a period*/
						document.getElementById("bell").play();

/*a work period just ended, so increase the total pomodoros done by one.*/
						totalPoms++;

/*erase all the arcs, because you want the next period to start when the confirm button is clicked, not immediately after the previous period. That gives you time to finish what you were doing without being penalized.*/
						document.getElementById("pomArc").setAttribute("d", describeArc(0, 0, 0, 0, 0));
						document.getElementById("progressArc").setAttribute("d", describeArc(0, 0, 0, 0, 0));
						document.getElementById("breakArc").setAttribute("d", describeArc(0, 0, 0, 0, 0));

/*the first sweet alert! This is what pops up when you finish a pomodoro. It congradulates the user and lets them start their break when they are ready. There is no option to stop the session in this box, that function is relegated to the second click on the clock, as noted by the title.*/
						swal({
										title: "Good job!",
										text: "You have completed <b>" + totalPoms + " pomodoros</b> of work! Are you ready for a relaxing <b>" + breakLength + " minutes</b> of whatever the heck you feel like?",
										type: "success",
										html: true,
										confirmButtonText: "Yes, I can't wait!"
								},

/*and this is what runs when the user clicks the confirm button on the popup. It starts the break, and gets the current time and sets the end from there.*/
								function() {
										breakRunning = true;
										var popTime = new Date();
										breakBeginAngle = 6 * popTime.getMinutes() + popTime.getSeconds() / 10;
										endBreak = 6 * popTime.getMinutes() + popTime.getSeconds() / 10 + 6 * breakLength;
								});
				}

/*this is what runs every second while the break is active. It just draws the break arc and the progress arc behind it.*/
				if (breakRunning) {
						document.getElementById("progressArc")
								.setAttribute("d", describeArc(50, 50, 44, breakBeginAngle, endBreak));
						document.getElementById("breakArc")
								.setAttribute("d", describeArc(50, 50, 44, 6 * d.getMinutes() + d.getSeconds() / 10, endBreak));
				}

/*this is what triggers when the angle of the minute hand matches the angle of the end of the break arc*/
				if ((6 * d.getMinutes() + d.getSeconds() / 10 >= endBreak - 0.1 && 6 * d.getMinutes() + d.getSeconds() / 10 <= endBreak + 0.1) && breakRunning) {

						breakRunning = false;

						document.getElementById("bell").play();

						document.getElementById("progressArc").setAttribute("d", describeArc(0, 0, 0, 0, 0));
						document.getElementById("breakArc").setAttribute("d", describeArc(0, 0, 0, 0, 0));

/*in the pomodoro productivity set up, every 4 pomodoros you get a 15 minute break. I decided to make it proportional to the user chosen break length. If you just did 3 pomodoros, your next break will be longer, and if you have just completed your 4th break, you have to set the break length back to 5mins*/
						if ((totalPoms + 1) % 4 === 0) {
								breakLength *= 3;
						} else if (totalPoms % 4 === 0) {
								breakLength /= 3;
						}

						swal({
										title: "Break's over!",
										text: "Hope that break left you feeling refreshed! Now it's time to get back to accomplishing your goals. Ready for<b> " + pomLength + " more minutes</b> of work?",
										html: true,
										confirmButtonText: "Let me at it!"
								},

/*starts the work cycle up again, automatically.*/
								function() {
										pomRunning = true;
										var popTime = new Date();
										endPom = 6 * popTime.getMinutes() + popTime.getSeconds() / 10 + 6 * pomLength;
										endBreak = endPom + 6 * breakLength;
										pomBeginAngle = 6 * popTime.getMinutes() + popTime.getSeconds() / 10;
								});
				}
		}, 1000);

/*updates the sentence in the modal under the place where you set your goal for the session with the correct total amount of time it will take to complete that many pomodoros. With correct grammar, which is why it's such a long function.*/
		function updateTimeParagraph() {
				var longBreak = breakLength * 3;
				var isAnd = "";
				var hourAmmount = Math.floor(((pomLength + breakLength) * goalPoms + (Math.floor(goalPoms / 4) * longBreak)) / 60);
				var minuteAmmount = ((pomLength + breakLength) * goalPoms + (Math.floor(goalPoms / 4) * longBreak)) % 60;
				var hourString = "";
				var minuteString = "";
				if (hourAmmount && minuteAmmount) {
						isAnd = "and";
				}
				if (hourAmmount === 1 && isAnd === "") {
						hourString = " <b>hour</b> "
				} else if (hourAmmount === 1) {
						hourString = " <b>" + hourAmmount + " hour</b> "
				} else if (hourAmmount > 1) {
						hourString = " <b>" + hourAmmount + " hours</b> "
				}
				if (minuteAmmount === 1) {
						minuteString = " <b>" + minuteAmmount + " minute</b> "
				} else if (minuteAmmount > 1) {
						minuteString = " <b>" + minuteAmmount + " minutes</b> "
				}

				$("#workTime").html("Reserve the next" + hourString + isAnd + minuteString + "for getting stuff done!");
		}

/*default goal with default settings takes 30mins to complete*/
		updateTimeParagraph();

/*if not in a session, clicking the clock opens the start up modal to begin one, and if you are in a session, clicking pops up a warning dialog before exiting the session  */
		$("#clock").click(function() {

				document.getElementById("chromeMobile").play();

				if (pomRunning || breakRunning) {


/*if you still haven't reached your goal, you are encouraged with an update of how many pomodoros and minutes you have left to reach it.*/
						if (totalPoms < goalPoms) {
								swal({
												title: "Not so fast!",
												type: "warning",
												text: "You are still <b>" + (goalPoms - totalPoms) + " pomodoros</b> short of your goal of <b>" + goalPoms + " pomodoros</b>! <br><br>Come on, you can do <b>" + (goalPoms - totalPoms) * pomLength + " more minutes</b> of work!",
												html: true,
												showCancelButton: true,
												confirmButtonText: "Continue!",
												cancelButtonText: "Stop.",
												closeOnCancel: false
										},

/*If you give up before you complete your goal you get a failure sound and a failure box. Shame!*/
										function(isConfirm) {
												if (!isConfirm) {
														document.getElementById("failure").play();
														sweetAlert({
																title: "You didn't make it.",
																text: "You couldn't complete the <b>" + goalPoms + " pomodoros</b> you planned on doing. Sometimes life gets in the way, we get it! See you back here later!",
																html: true,
																type: "error"
														});

/*reset everything for new session*/
														totalPoms = 0;
														pomRunning = false;
														breakRunning = false;
														$("#instructions").html("click clock to <span class= 'green'>start</span>");
														document.getElementById("progressArc").setAttribute("d", describeArc(0, 0, 0, 0, 0));
														document.getElementById("pomArc").setAttribute("d", describeArc(0, 0, 0, 0, 0));
														document.getElementById("breakArc").setAttribute("d", describeArc(0, 0, 0, 0, 0));
												}
										});
						} else {

/*So if you've completed your goal for the session you get this friendlier pop up congradulating you and lightly suggesting you keep working.*/
								swal({
												title: "Stop the productivity train?",
												type: "warning",
												text: "Hey, you've reached your goal of <b>" + goalPoms + " pomodoros</b>! You've built up some good momentum, are you sure you want to stop?",
												html: true,
												showCancelButton: true,
												confirmButtonText: "Stop.",
												cancelButtonText: "Continue!",
												closeOnConfirm: false
										},
										function(isConfirm) {

/*you succeeded so you get the success sound and a success message. good for you! */
												if (isConfirm) {
														document.getElementById("success").play();
														sweetAlert({
																title: "Great job!",
																text: "In the end you did <b>" + totalPoms + " pomodoros</b>, for a total of <b>" + totalPoms * pomLength + " minutes</b> of work! You are awesome! Come back soon!",
																html: true,
																type: "success"
														});

/*reset everything*/
														totalPoms = 0;
														pomRunning = false;
														breakRunning = false;
														$("#instructions").html("click clock to <span class='green'>start</span>");
														document.getElementById("progressArc").setAttribute("d", describeArc(0, 0, 0, 0, 0));
														document.getElementById("pomArc").setAttribute("d", describeArc(0, 0, 0, 0, 0));
														document.getElementById("breakArc").setAttribute("d", describeArc(0, 0, 0, 0, 0));
												}
										});
						}

				} else {
/*and if you're not currently in a session, this activates the starting pop up*/
						$("#startModal").modal();
				}
		});

/*any way you close the modal, by clicking the close button, confirm button, or clicking outside the box, starts a session. Makes it faster when you just want to start working. This initializes the end positions of all the arcs, and changes the instructions at the top of the screen.*/
		$("#startModal").on('hidden.bs.modal', function() {
				var curTime = new Date();
				endPom = (6 * curTime.getMinutes() + curTime.getSeconds() / 10 + 6 * pomLength);
				endBreak = (endPom + 6 * breakLength);
				pomRunning = true;
				pomBeginAngle = 6 * curTime.getMinutes() + curTime.getSeconds() / 10;
				$("#instructions").html("click clock again to <b>stop</b>");
		});

/*gets the goal number of pomodoros*/
		$('#pomNumSlider').on('input', function() {
				$('#pomQuantity').val($('#pomNumSlider').val());
				goalPoms = $('#pomNumSlider').val();

				updateTimeParagraph();
		});

		$('#pomQuantity').on('input', function() {
				$('#pomNumSlider').val($('#pomQuantity').val());
				goalPoms = $('#pomQuantity').val();
				updateTimeParagraph();
		});

		/*hides the goal box, shows the place where you can change the pomodoro length*/
		$("#settingsBtn").click(function() {
				$("#settings").toggle();
				$("#goalDiv").toggle();
				if ($("#modalTitle").html() === "Choose your goal!") {
						$("#modalTitle").html("How many minutes?");
				} else {
						$("#modalTitle").html("Choose your goal!");
				}

		});

/*when you update the work slider or input box or the break ones, it updates the total time and makes sure you didn't go over 60 minutes total work and break time per cycle. I could probably refactor all the following code. Someday!*/
		$('#workLength').on('input', function() {
				$('#workSlider').val($('#workLength').val());
				pomLength = parseInt($('#workLength').val(), 10);

				if (pomLength + breakLength > 60) {
						breakLength = 60 - pomLength;
						$('#playLength').val(breakLength);
						$('#playSlider').val(breakLength);
				}
				updateTimeParagraph();
		});

		$('#workSlider').on('input', function() {
				$('#workLength').val($('#workSlider').val());
				pomLength = parseInt($('#workSlider').val(), 10);
				if (pomLength + breakLength > 60) {
						breakLength = 60 - pomLength;
						$('#playLength').val(breakLength);
						$('#playSlider').val(breakLength);
				}
				updateTimeParagraph();
		});

		$('#playLength').on('input', function() {
				$('#playSlider').val($('#playLength').val());
				breakLength = parseInt($('#playLength').val(), 10);
				if (pomLength + breakLength > 60) {
						pomLength = 60 - breakLength;
						$('#workLength').val(pomLength);
						$('#workSlider').val(pomLength);
				}
				updateTimeParagraph();
		});

		$('#playSlider').on('input', function() {
				$('#playLength').val($('#playSlider').val());
				breakLength = parseInt($('#playSlider').val(), 10);
				if (pomLength + breakLength > 60) {
						pomLength = 60 - breakLength;
						$('#workLength').val(pomLength);
						$('#workSlider').val(pomLength);
				}
				updateTimeParagraph();
		});

});