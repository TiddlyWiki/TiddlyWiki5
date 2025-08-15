/*\
title: $:/core/modules/macros/ago.js
type: application/javascript
module-type: macro

Macro to return a human-readable relative time string (e.g., "5 minutes ago", "2 days ago")

\*/

"use strict";

exports.name = "ago";

exports.params = [
	{name: "date"},
	{name: "format"}
];

exports.run = function(date, format) {
	if(!date) {
		return "";
	}
	
	var dateObj;
	if(date instanceof Date) {
		dateObj = date;
	} else if(typeof date === "string") {
		dateObj = $tw.utils.parseDate(date);
	} else {
		dateObj = new Date(date);
	}
	
	if(isNaN(dateObj.getTime())) {
		return "";
	}
	
	var now = new Date();
	var diff = now - dateObj;
	
	if(diff < 0) {
		return $tw.language.getString("Time/InFuture");
	}
	
	// Calculate all time units
	var totalSeconds = Math.floor(diff / 1000);
	var totalMinutes = Math.floor(totalSeconds / 60);
	var totalHours = Math.floor(totalMinutes / 60);
	var totalDays = Math.floor(totalHours / 24);
	
	// Calculate months and years properly
	var years = 0;
	var months = 0;
	
	var tempDate = new Date(dateObj);
	
	// Calculate years
	while(tempDate.getFullYear() < now.getFullYear() - 1 || 
		  (tempDate.getFullYear() === now.getFullYear() - 1 && 
		   (tempDate.getMonth() < now.getMonth() || 
		    (tempDate.getMonth() === now.getMonth() && tempDate.getDate() <= now.getDate())))) {
		years++;
		tempDate.setFullYear(tempDate.getFullYear() + 1);
	}
	
	// Calculate remaining months
	while((tempDate.getFullYear() < now.getFullYear() || 
		   (tempDate.getFullYear() === now.getFullYear() && tempDate.getMonth() < now.getMonth() - 1)) ||
		  (tempDate.getFullYear() === now.getFullYear() && 
		   tempDate.getMonth() === now.getMonth() - 1 && 
		   tempDate.getDate() <= now.getDate())) {
		months++;
		tempDate.setMonth(tempDate.getMonth() + 1);
	}
	
	// Calculate remaining days after accounting for months/years
	var days = Math.floor((now - tempDate) / (1000 * 60 * 60 * 24));
	var weeks = Math.floor(days / 7);
	days = days % 7; // Remaining days after weeks
	
	// Calculate remaining hours, minutes, seconds
	var remainingMillis = (now - tempDate) % (1000 * 60 * 60 * 24);
	var hours = Math.floor(remainingMillis / (1000 * 60 * 60));
	remainingMillis = remainingMillis % (1000 * 60 * 60);
	var minutes = Math.floor(remainingMillis / (1000 * 60));
	var seconds = Math.floor((remainingMillis % (1000 * 60)) / 1000);
	
	// Set variables for use in templates
	this.setVariable("ago-years", years.toString());
	this.setVariable("ago-months", months.toString());
	this.setVariable("ago-weeks", weeks.toString());
	this.setVariable("ago-days", days.toString());
	this.setVariable("ago-hours", hours.toString());
	this.setVariable("ago-minutes", minutes.toString());
	this.setVariable("ago-seconds", seconds.toString());
	this.setVariable("ago-total-days", totalDays.toString());
	this.setVariable("ago-total-hours", totalHours.toString());
	this.setVariable("ago-total-minutes", totalMinutes.toString());
	this.setVariable("ago-total-seconds", totalSeconds.toString());
	
	// Return formatted string based on most significant unit
	if(format === "short") {
		if(years > 0) return years + $tw.language.getString("Time/YearsShort");
		if(months > 0) return months + $tw.language.getString("Time/MonthsShort");
		if(weeks > 0) return weeks + $tw.language.getString("Time/WeeksShort");
		if(totalDays > 0 && totalDays < 7) return totalDays + $tw.language.getString("Time/DaysShort");
		if(totalHours > 0) return totalHours + $tw.language.getString("Time/HoursShort");
		if(totalMinutes > 0) return totalMinutes + $tw.language.getString("Time/MinutesShort");
		if(totalSeconds > 0) return totalSeconds + $tw.language.getString("Time/SecondsShort");
		return $tw.language.getString("Time/JustNow");
	} else {
		if(years > 0) return years === 1 ? $tw.language.getString("Time/OneYearAgo") : years + " " + $tw.language.getString("Time/YearsAgo");
		if(months > 0) return months === 1 ? $tw.language.getString("Time/OneMonthAgo") : months + " " + $tw.language.getString("Time/MonthsAgo");
		if(weeks > 0) return weeks === 1 ? $tw.language.getString("Time/OneWeekAgo") : weeks + " " + $tw.language.getString("Time/WeeksAgo");
		if(totalDays > 0 && totalDays < 7) return totalDays === 1 ? $tw.language.getString("Time/OneDayAgo") : $tw.language.getString("Time/DaysAgo");
		if(totalHours > 0) return totalHours === 1 ? $tw.language.getString("Time/OneHourAgo") : $tw.language.getString("Time/HoursAgo");
		if(totalMinutes > 0) return totalMinutes === 1 ? $tw.language.getString("Time/OneMinuteAgo") : $tw.language.getString("Time/MinutesAgo");
		if(totalSeconds > 0) return totalSeconds === 1 ? $tw.language.getString("Time/OneSecondAgo") : $tw.language.getString("Time/SecondsAgo");
		return $tw.language.getString("Time/JustNow");
	}
};
