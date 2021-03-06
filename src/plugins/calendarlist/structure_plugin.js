define( ['structure_custom' ], function( VisuDesign_Custom ) {

VisuDesign_Custom.prototype.addCreator("calendarlist", {
    create: function (element, path, flavour, type) {
        var $el = $(element);

        function uniqid() {
            var newDate = new Date;
            return newDate.getTime();
        }
        var id = "calendarList_" + uniqid();

        var ret_val = $('<div class="widget clearfix calendarList" />');
        templateEngine.design.setWidgetLayout(ret_val, $el, path);
        templateEngine.design.makeWidgetLabel(ret_val, $el);

        var actor = $('<div class="actor calendarListBody"><div class="calendarList_inline" id="' + id + '"></div></div>');
        var calendarList = $("#" + id, actor);

        if ($el.attr("width")) {
            calendarList.css("width", $el.attr("width"));
        }
        if ($el.attr("height")) {
            calendarList.css("height", $el.attr("height"));
        }

        ret_val.append(actor);

        calendarList.data("src", "plugins/calendarlist/calendarlist.php");
        calendarList.data("maxquantity", $el.attr("maxquantity"));
        calendarList.data("refresh", $el.attr("refresh"));
        calendarList.data("calendar", $el.find('calendar'));
		calendarList.data("days", $el.find('days'));

        templateEngine.bindActionForLoadingFinished(function () {
            refreshcalendarList(calendarList);
        });

        return ret_val;
    }
});

function refreshcalendarList(calendarList) {
    var calendarList = $(calendarList);

    var refresh = calendarList.data('refresh');
    var src = calendarList.data('src');
    var maxquantity = calendarList.data('maxquantity');
    var calendar = calendarList.data('calendar');
	var days = calendarList.data('days');

    $(function () {
        $(calendarList).calendarListlocal({
            src: src,
            maxquantity: maxquantity,
            calendar: calendar
        });
    });

    if (typeof (refresh) != "undefined" && refresh) {
        // reload regularly
        window.setTimeout(function (calendarList) {
            refreshcalendarList(calendarList)
        }, refresh * 1000 * 60, calendarList);
    }

    return false;
};

(function ($) {
    jQuery.fn.extend({
        calendarListlocal: function (options) {
            var defaults = {
                src: '',
				days: 30,
                html: '<span>{date}: {text}{where}</span>',
                wrapper: 'li',
                dataType: 'json',
                datetime: true
            }
            var options = jQuery.extend(defaults, options);

            return this.each(function () {
                var o = options;
                var c = jQuery(this);

                if (o.src == '') {
                    console.log('calendarListlocal: no src URL');
                    return; // avoid the request
                }

                var formData = {
                    'maxquantity': o.maxquantity,
                };

                for (var i = 0; i < o.calendar.length; i++) {
                    var calendarname = 'calendarname' + i;
                    var type = 'type' + i;
                    var userid = 'userid' + i;
                    var magiccookie = 'magiccookie' + i;
					var days = 'days' + i;
                    formData[calendarname] = i; //o.calendar[i].textContent;
                    formData[type] = o.calendar[i].getAttribute('type');
                    formData[userid] = o.calendar[i].getAttribute('userid');
					if (o.calendar[i].hasAttribute('magiccookie') === true) {
                      formData[magiccookie] = o.calendar[i].getAttribute('magiccookie');
					} else {
                      formData[magiccookie] = '';
					}
					if (o.calendar[i].hasAttribute('days') === true) {
					  formData[days] = o.calendar[i].getAttribute('days');
					} else {
					  formData[days] = o.days;
					}
                }

                jQuery.ajax({
                    url: o.src,
                    type: 'POST',
                    data: formData,
                    dataType: o.dataType,
                    error: function (xhr, status, e) {
                        console.log('C: #%s, Error: %s, calendarList: %s', $(c).attr('id'), e, o.src);
                    },
                    success: function (result) {
                        c.html('');
                        var items = result.calendarList.calendarListEntries;
                        var itemnum = items.length;
                        var date = '';
                        var time = '';

                        for (var i = 0; i < itemnum; i++) {
                            var item = items[i];
                            var itemHtml = o.html;

                            color = '#FFFFFF';
                            for (var ix = 0; ix < o.calendar.length; ix++) {
                                if (item.calendarName == ix) {
									if (o.calendar[ix].hasAttribute('color') === true) {
                                      color = o.calendar[ix].getAttribute('color');
									} else {
                                      color = '#FFFFFF';
									}

									if (o.calendar[ix].hasAttribute('format') === true) {
                                      format = o.calendar[ix].getAttribute('format');
									} else {
									  format = '{date}: {text}{where}';
									}
									itemHtml = '<span>' + format + '</span>'
                                }
                            }

                            date = item.StartDate;
							if (item.StartTime != '00:00') {
								date = date + ', ' + item.StartTime;
							}
                            if (item.StartDate != item.EndDate || item.StartTime != item.EndTime) {
                                date = date + ' - ';
                            }
                            if (item.StartDate != item.EndDate) {
                                date = date + item.EndDate + ', ' + item.EndTime;
                            } else {
                                if (item.StartTime != item.EndTime) {
                                    date = date + item.EndTime;
                                }
                            }

                            itemHtml = itemHtml.replace(/{text}/, item.description);
                            if (item.where != '') {
                                where = ' (' + item.where + ')';
                            } else {
                                where = item.where;
                            }
                            itemHtml = itemHtml.replace(/{where}/, where);
                            itemHtml = itemHtml.replace(/{date}/, date);
                            //console.log('%i: %s', i, itemHtml);

                            var $row = $('<span style="color:' + color + '">').append(itemHtml).append('</span><br>');
                            //console.log('%i: %s', i, $row);

                            c.append($row);
                        }
                    }
                });
            });
        }
    });
})(jQuery);

});