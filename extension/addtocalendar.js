// Copyright 2013 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

function trim(str) {
    if (str === undefined)
        return str;
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

// Strip out any HTML or HTML entities from this element
// e.g. "<div>Some <b>string</b> &amp; example</div>" => "Some string & example"
function unescapeElement(node) {
    var result = "";
    for (var i = 0; i < node.childNodes.length; ++i) {
        var child = node.childNodes[i];
        if (child.childNodes.length == 0) {
            result += child.nodeValue;
        } else {
            result += unescapeElement(child);
        }
    }
    return trim(result);
}

function elementAfter(text) {
    var ths = document.getElementsByTagName("th")
    for (var i = 0; i < ths.length; ++i) {
        var th = ths[i];
        if (th.innerHTML.indexOf(text) == -1)
            continue;
        if (th.nextSibling)
            return th.nextSibling.nextSibling;
        return;
    }
}

function textAfter(text) {
    var content = elementAfter(text);
    if (!content)
        return "";
    return unescapeElement(content);
}

function getTitle() {
    var titleElements = document.getElementsByClassName("appPlainTitle");
    if (titleElements.length != 1) {
        console.error("Wrong number of title elements: " + titleElements.length);
        return;
    }
    return unescapeElement(titleElements[0]);
}

function createCalendarLink(title, loc, dates, description) {
    var link = document.createElement("a");

    var params = {
        'ctext': title,
        'details': description,
        'location': loc,
        'dates': dates,
        'action': 'TEMPLATE',
    };

    var url = 'http://www.google.com/calendar/event';
    var first = true;
    for (var key in params) {
        if (first) {
            url += "?";
            first = false;
        } else {
            url += "&";
        }
        url += key + "=" + encodeURIComponent(params[key]);
    }
    link.href = url;

    var img = document.createElement("img");
    img.src = "http://www.google.com/calendar/images/ext/gc_button1.gif";
    img.style.border = "0px";
    link.appendChild(img);

    return link;
}

function scheduleToDates(str) {
    // Of the form:
    //   "Fri, 1:45-3:00pm"
    //   Sat, 11:30 am-12:45 pm
    //   Sun, 8:45 pm-Mon, 3:00 am
    // Separated by ndash

    var datestrs = str.split("–");  // ndash
    if (datestrs.length != 2) {
        console.error("Found " + datestrs.length - 1 + " ndashes, not 2");
        return;
    }
    var startStr = datestrs[0];
    var endStr = datestrs[1];

    function strToDay(str) {
        var dayNameToNumber = {
            "Thu": 23,
            "Fri": 24,
            "Sat": 25,
            "Sun": 26,
            "Mon": 27,
        };

        for (var dateStr in dayNameToNumber) {
            if (str.indexOf(dateStr) != -1) {
                return dayNameToNumber[dateStr];
            }
        }
    }
    var startDay = strToDay(startStr);
    var endDay = strToDay(endStr);
    if (!startDay) {
        console.error("Couldn't parse start day");
        return;
    }
    if (!endDay)
        endDay = startDay;

    function stripOffDay(str) {
        var idx = str.indexOf(", ");
        if (idx == -1)
            return str;
        return str.substring(idx + 2);
    }
    startStr = stripOffDay(startStr);
    endStr = stripOffDay(endStr);

    // Offset from 12->24hour time.
    function strToOffset(str) {
        if (str.indexOf("am") != -1 || str.indexOf("AM") != -1)
            return 0;
        if (str.indexOf("pm") != -1 || str.indexOf("PM") != -1)
            return 12;
        return undefined;
    }
    var startOffset = strToOffset(startStr);
    var endOffset = strToOffset(endStr);
    if (endOffset === undefined) {
        console.error("Couldn't find AM or PM in end time");
        return;
    }
    if (startOffset === undefined)
        startOffset = endOffset;

    function stripEverythingButTime(str) {
        return str.replace(/[^0-9:]/g, "");
    }
    startStr = stripEverythingButTime(startStr);
    endStr = stripEverythingButTime(endStr);

    function toHourMinute(timeStr, offset) {
        var hm = timeStr.split(":");
        if (hm.length != 2) {
            console.error("Wrong number of colons in time, found " +
                          hm.length - 1);
            return;
        }
        var hour = parseInt(hm[0]) + offset;
        if (hour == 12 && offset == 0)
            hour = 0;
        var minute = parseInt(hm[1]);
        return [hour, minute]
    }

    var startHM = toHourMinute(startStr, startOffset);
    if (startHM === undefined)
        return;
    var endHM = toHourMinute(endStr, endOffset);
    if (endHM === undefined)
        return;

    // Hilariously, month is zero-based.  Go home JavaScript, you're drunk.
    var year = 2013;
    var month = 5;
    var startDate = new Date(year, month - 1, startDay, startHM[0], startHM[1]);
    var endDate = new Date(year, month - 1, endDay, endHM[0], endHM[1]);
    if (endDate < startDate) {
        console.error("Start time after end time");
        return;
    }

    // Since all the times are given in CDT, convert the date's time to UTC
    // manually to avoid having to deal with any local timezones.
    function adjustToUTCFromCDT(date) {
        date.setHours(date.getHours() + 5);
    }
    adjustToUTCFromCDT(startDate);
    adjustToUTCFromCDT(endDate);

    function localDateToString(date) {
        function padWithZero(str) {
            str = "" + str;
            if (str.length == 1)
                return "0" + str;
            return str;
        }

        // YYYY MM DD "T" HH MM SS "Z"
        var str = "" + date.getFullYear();
        str += padWithZero(date.getMonth() + 1);
        str += padWithZero(date.getDate());
        str += "T";
        str += padWithZero(date.getHours());
        str += padWithZero(date.getMinutes());
        str += "00Z";
        return str;
    }

    return localDateToString(startDate) + "/" + localDateToString(endDate);
}

function addButton() {
    var title = getTitle();
    if (!title) {
        console.error("Missing title");
        return;
    }
    var loc = textAfter("Location");
    if (!loc) {
        console.error("Missing location");
        return;
    }
    var schedule = textAfter("Schedule");
    if (!schedule) {
        console.error("Missing schedule");
        return;
    }

    var dates = scheduleToDates(schedule);
    if (!dates) {
        console.error("Couldn't parse schedule: " + schedule);
        return;
    }

    var description = textAfter("Description");
    if (description) {
        // Google Calendar craps out with 414 errors if the URI is too long.
        // For sanity's sake, cap the description length to something reasonable.
        var max_length = 1000;
        if (description.length > max_length) {
            description = description.substring(0, max_length);
            description += "\n(cut for length)";
        }
        description += "\n\n";
    } else {
        description = "";
    }

    var panelists = textAfter("Panelists");
    if (panelists.length > 0)
        description += "Panelists: " + panelists + "\n";
    description += "URL: " + window.location;

    var link = createCalendarLink(title, loc, dates, description);
    var scheduleElement = elementAfter("Schedule");
    scheduleElement.appendChild(link);
}

addButton();
