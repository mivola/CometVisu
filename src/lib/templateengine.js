/* templateengine.js (c) 2010-2015 by Christian Mayer [CometVisu at ChristianMayer dot de]
 *
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation; either version 3 of the License, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA
 * 
 * @module Templateengine
 * @title  CometVisu templateengine
 */

///////////////////////////////////////////////////////////////////////
//
//  Configuration of RequireJS:
//

require.config({
  baseUrl: './',
  waitSeconds: 30, // default: 7 seconds
  paths: {
    'css':                      'dependencies/css',
    'jquery':                   'dependencies/jquery',
    'compatibility':            'lib/compatibility',
    'jquery-ui':                'dependencies/jquery-ui',
    'strftime':                 'dependencies/strftime',
    'scrollable':               'dependencies/scrollable',
    'jquery.ui.touch-punch':    'dependencies/jquery.ui.touch-punch',
    'jquery.svg.min':           'dependencies/jquery.svg.min',
    'cometvisu-client':         'lib/cometvisu-client',
    'iconhandler':              'lib/iconhandler',
    'pagepartshandler':         'lib/pagepartshandler',
    'trick-o-matic':            'lib/trick-o-matic',
    '_common':                  'structure/pure/_common',
    'structure_custom':         'config/structure_custom',
    'widget_break':             'structure/pure/break',
    'widget_designtoggle':      'structure/pure/designtoggle',
    'widget_group':             'structure/pure/group',
    'widget_rgb':               'structure/pure/rgb',
    'widget_web':               'structure/pure/web',
    'widget_image':             'structure/pure/image',
    'widget_imagetrigger':      'structure/pure/imagetrigger',
    'widget_include':           'structure/pure/include',
    'widget_info':              'structure/pure/info',
    'widget_infotrigger':       'structure/pure/infotrigger',
    'widget_line':              'structure/pure/line',
    'widget_multitrigger':      'structure/pure/multitrigger',
    'widget_navbar':            'structure/pure/navbar',
    'widget_page':              'structure/pure/page',
    'widget_pagejump':          'structure/pure/pagejump',
    'widget_refresh':           'structure/pure/refresh',
    'widget_reload':            'structure/pure/reload',
    'widget_slide':             'structure/pure/slide',
    'widget_switch':            'structure/pure/switch',
    'widget_text':              'structure/pure/text',
    'widget_toggle':            'structure/pure/toggle',
    'widget_trigger':           'structure/pure/trigger',
    'widget_pushbutton':        'structure/pure/pushbutton',
    'widget_urltrigger':        'structure/pure/urltrigger',
    'widget_unknown':           'structure/pure/unknown',
    'widget_audio':             'structure/pure/audio',
    'widget_video':             'structure/pure/video',
    'widget_wgplugin_info':     'structure/pure/wgplugin_info',
    'transform_default':        'transforms/transform_default',
    'transform_knx':            'transforms/transform_knx',
    'transform_oh':             'transforms/transform_oh',
  },
  'shim': {
    'scrollable':            ['jquery'],
    'jquery-ui':             ['jquery'],
    'jquery.ui.touch-punch': ['jquery', 'jquery-ui'],
    'jquery.svg.min':        ['jquery']
    /*
    '': ['jquery'],
    'jquery-i18n': ['jquery'],
    'superfish':   ['jquery']
    */
  }
});

///////////////////////////////////////////////////////////////////////
//
//  Main:
//
var templateEngine;
require([
  'jquery', '_common', 'structure_custom', 'trick-o-matic', 'pagepartshandler', 
  'compatibility', 'jquery-ui', 'strftime', 'scrollable', 
  'jquery.ui.touch-punch', 'jquery.svg.min', 'cometvisu-client', 'iconhandler', 
  'widget_break', 'widget_designtoggle',
  'widget_group', 'widget_rgb', 'widget_web', 'widget_image',
  'widget_imagetrigger', 'widget_include', 'widget_info', 'widget_infotrigger', 
  'widget_line', 'widget_multitrigger', 'widget_navbar', 'widget_page', 
  'widget_pagejump', 'widget_refresh', 'widget_reload', 'widget_slide', 
  'widget_switch', 'widget_text', 'widget_toggle', 'widget_trigger', 
  'widget_pushbutton', 'widget_urltrigger', 'widget_unknown', 'widget_audio', 
  'widget_video', 'widget_wgplugin_info', 
  'transform_default', 'transform_knx', 'transform_oh'
], function( $, design, VisuDesign_Custom, Trick_O_Matic, PagePartsHandler ) {
  profileCV( 'templateEngine start' );
  
templateEngine = new TemplateEngine();

$(window).bind('resize', templateEngine.handleResize);
$(window).unload(function() {
  if( templateEngine.visu ) templateEngine.visu.stop();
});
$(document).ready(function() {
  function configError(textStatus) {
    var configSuffix = (templateEngine.configSuffix ? templateEngine.configSuffix : '');
    var message = 'Config-File Error!<br/>';
    switch (textStatus) {
      case 'parsererror':
        message += 'Invalid config file!<br/><a href="check_config.php?config=' + configSuffix + '">Please check!</a>';
        break;
      case 'libraryerror':
        var link = window.location.href;
        if (link.indexOf('?') <= 0) {
          link = link + '?';
        }
        link = link + '&libraryCheck=false';
        message += 'Config file has wrong library version!<br/>' +
          'This can cause problems with your configuration</br>' + 
          '<p>You can run the <a href="./upgrade/index.php?config=' + configSuffix + '">Configuration Upgrader</a>.</br>' +
          'Or you can start without upgrading <a href="' + link + '">with possible configuration problems</a>.</p>';
        break;
      default:
        message += 'Unhandled error of type "' + textStatus + '"';
    }
    $('#loading').html(message);
  };
  // get the data once the page was loaded
  var ajaxRequest = {
    noDemo: true,
    url : 'config/visu_config'+ (templateEngine.configSuffix ? '_' + templateEngine.configSuffix : '') + '.xml',
    cache : !templateEngine.forceReload,
    success : function(xml) {
      if (!xml || !xml.documentElement || xml.getElementsByTagName( "parsererror" ).length) {
        configError("parsererror");
      }
      else {
        // check the library version
        var xmlLibVersion = $('pages', xml).attr("lib_version");
        if (xmlLibVersion == undefined) {
          xmlLibVersion = -1;
        }
        if (templateEngine.libraryCheck && xmlLibVersion < templateEngine.libraryVersion) {
          configError("libraryerror");
        }
        else {
          var $loading = $('#loading');
          $loading.html( $loading.text().trim() + '.' );
          templateEngine.parseXML(xml);
        }
      }
    },
    error : function(jqXHR, textStatus, errorThrown) {
      if( 404 === jqXHR.status && ajaxRequest.noDemo )
      {
        var $loading = $('#loading');
        $loading.html( $loading.text().trim() + '!' );
        ajaxRequest.noDemo = false;
        ajaxRequest.url = ajaxRequest.url.replace('config/','config/demo/');
        $.ajax( ajaxRequest );
        return;
      }
      configError(textStatus);
    },
    dataType : 'xml'
  };
  $.ajax( ajaxRequest );
});

function TemplateEngine( undefined ) {
  var thisTemplateEngine = this;
  this.libraryVersion = 7;
  this.libraryCheck = true;
  if ($.getUrlVar('libraryCheck')) {
    this.libraryCheck = $.getUrlVar('libraryCheck') != 'false'; // true unless set to false
  }

  var loadReady = { page: false, plugins: false };
  function delaySetup( id ) {
    loadReady[ id ] = false;
    return function() {
      delete loadReady[ id ];
      setup_page();
    };
  };
  this.design = new VisuDesign_Custom();
  this.pagePartsHandler = new PagePartsHandler();
  
  var rememberLastPage = false;
  this.currentPage = null;
  this.currentPageUnavailableWidth = -1;
  this.currentPageUnavailableHeight = -1;
  this.currentPageNavbarVisibility = null;
  
  // if true the whole widget reacts on click events
  // if false only the actor in the widget reacts on click events
  this.bindClickToWidget = false;
    
  // threshold where the mobile.css is loaded
  this.maxMobileScreenWidth = 480;
  // use to recognize if the screen width has crossed the maxMobileScreenWidth
  var lastBodyWidth=0;

  var mappings = {}; // store the mappings
  var stylings = {}; // store the stylings
 
  var ga_list = {};
  this.widgetData = {}; // hash to store all widget specific data
  /**
   * Return (reference to) widgetData object by path.
   */
  this.widgetDataGet = function( path ) {
    return this.widgetData[ path ] || (this.widgetData[ path ] = {});
  };
  /**
   * Return (reference to) widget data by element
   */
  this.widgetDataGetByElement = function( element ) {
    var
      parent = $(element).parent(),
      path = parent.attr('id');
      
    if( path === undefined )
      path = parent.parent().attr('id');
    
    return this.widgetDataGet( path );
  };
  /**
   * Merge obj in the widgetData.
   */
  this.widgetDataInsert = function( path, obj ) {
    var thisWidgetData = this.widgetDataGet( path );
    
    for( var attrname in obj )
      thisWidgetData[ attrname ] = obj[ attrname ];
    
    return thisWidgetData;
  };
  
  /**
   * Function to test if the path is in a valid form.
   * Note: it doesn't check if it exists!
   */
  var pathRegEx = /^id(_[0-9]+)+$/;

  this.main_scroll;
  this.old_scroll = '';
  this.visu;

  this.scrollSpeed;

  this.defaultColumns = 12;
  this.minColumnWidth = 120;
  this.enableColumnAdjustment = false;
  
  this.enableAddressQueue = $.getUrlVar('enableQueue') ? true : false;
  
  this.backend = 'cgi-bin'; // default path to backend
  if ($.getUrlVar("backend")) {
    this.backend = $.getUrlVar("backend");
  }

  this.initBackendClient = function() {
    if (thisTemplateEngine.backend=="oh") {
      // the path to the openHAB cometvisu backend is cv
      thisTemplateEngine.backend = '/services/cv/';
      thisTemplateEngine.visu = new CometVisu(thisTemplateEngine.backend);
      thisTemplateEngine.visu.resendHeaders = {'X-Atmosphere-tracking-id':null};
      thisTemplateEngine.visu.headers= {'X-Atmosphere-Transport':'long-polling'};
    } else {
      thisTemplateEngine.backend = '/' + thisTemplateEngine.backend + '/';
      thisTemplateEngine.visu = new CometVisu(thisTemplateEngine.backend);
    }
    function update(json) {
      for (key in json) {
        $.event.trigger('_' + key, json[key]);
      }
    };
    thisTemplateEngine.visu.update = function(json) { // overload the handler
      $(document).trigger( 'firstdata', json );
      profileCV( 'firstdata start' );
      update( json );
      profileCV( 'firstdata updated' );
      thisTemplateEngine.visu.update = update; // handle future requests directly
    }
    thisTemplateEngine.visu.user = 'demo_user'; // example for setting a user
  };

  this.configSuffix;
  if ($.getUrlVar("config")) {
    this.configSuffix = $.getUrlVar("config");
  }

  this.clientDesign = "";

  if (typeof this.forceReload == "undefined") {
    this.forceReload = false;
  }

  if ($.getUrlVar('forceReload')) {
    this.forceReload = $.getUrlVar('forceReload') != 'false'; // true unless set
                                                              // to false
  }

  if ($.getUrlVar('forceDevice')) {
    this.forceMobile = $.getUrlVar('forceDevice') == 'mobile';
    this.forceNonMobile = !this.forceMobile;
  } else {
    this.forceMobile = false;
    this.forceNonMobile = false;
  }
  var uagent = navigator.userAgent.toLowerCase();
  this.mobileDevice = (/(android|blackberry|iphone|ipod|series60|symbian|windows ce|palm)/i.test(uagent));
  if (/(nexus 7|tablet)/i.test(uagent)) this.mobileDevice = false;  // Nexus 7 and Android Tablets have a "big" screen, so prevent Navbar from scrolling
  this.mobileDevice |= this.forceMobile;  // overwrite detection when set by URL


  // "Bug"-Fix for ID: 3204682 "Caching on web server"
  // This isn't a real fix for the problem as that's part of the web browser,
  // but
  // it helps to avoid the problems on the client, e.g. when the config file
  // has changed but the browser doesn't even ask the server about it...
  this.forceReload = true;

  // Disable features that aren't ready yet
  // This can be overwritten in the URL with the parameter "maturity"
  this.use_maturity;
  if ($.getUrlVar('maturity')) {
    this.url_maturity = $.getUrlVar('maturity');
    if (!isNaN(this.url_maturity - 0)) {
      this.use_maturity = this.url_maturity - 0; // given directly as number
    } else {
      this.use_maturity = Maturity[this.url_maturity]; // or as the ENUM name
    }
  }

  if (isNaN(this.use_maturity)) {
    this.use_maturity = design.Maturity.release; // default to release
  }

  this.transformEncode = function(transformation, value) {
    var basetrans = transformation.split('.')[0];
    return transformation in Transform ? Transform[transformation]
        .encode(value) : (basetrans in Transform ? Transform[basetrans]
        .encode(value) : value);
  };

  this.transformDecode = function(transformation, value) {
    var basetrans = transformation.split('.')[0];
    return transformation in Transform ? Transform[transformation]
        .decode(value) : (basetrans in Transform ? Transform[basetrans]
        .decode(value) : value);
  };
  
  this.addAddress = function(address) {
    ga_list[address]=1;
  };
  
  this.getAddresses = function() {
    return Object.keys(ga_list);
  };

  this.bindActionForLoadingFinished = function(fn) {
    $("#pages").bind("done", fn);
  };
  
  function fireLoadingFinishedAction() {
    $("#pages").triggerHandler("done");
  };

  /*
   * this function implements widget stylings 
   */
  this.setWidgetStyling = function(e, value, styling) {
    var sty = stylings[styling];
    if (sty) {    
      e.removeClass(sty['classnames']); // remove only styling classes
      function findValue(v, findExact) {
        if (undefined === v) {
          return false;
        }
        if (sty[v]) { // fixed value
          e.addClass(sty[v]);
          return true;
        }
        else { 
          var range = sty['range'];
          if (findExact && range[v]) {
            e.addClass(range[v][1]);
            return true;
          }
          var valueFloat = parseFloat(v);
          for (var min in range) {
            if (min > valueFloat) continue;
            if (range[min][0] < valueFloat) continue; // check max
            e.addClass(range[min][1]);
            return true;
          }
        }
        return false;
      }
      if (!findValue(value, false) && sty['defaultValue'] !== undefined) {
        findValue(sty['defaultValue'], true);
      }
    }
    return this;
  }

  this.map = function(value, this_map) {
    if (this_map && mappings[this_map]) {
      var m = mappings[this_map];

      var ret = value;
      if (m.formula) {
        ret = m.formula(ret);
      }

      function mapValue(v) {
        if (m[v]) {
          return m[v];
        } else if (m['range']) {
          var valueFloat = parseFloat(v);
          var range = m['range'];
          for (var min in range) {
            if (min > valueFloat) continue;
            if (range[min][0] < valueFloat) continue; // check max
            return range[min][1];
          }
        }
        return v; // pass through when nothing was found
      }
      var ret = mapValue(ret);
      if (!ret && m['defaultValue']) {
        ret = mapValue(m['defaultValue']);
      }
      if (ret) {
        return ret;
      }
    }
    return value;
  };

  /**
   * Look up the entry for @param value in the mapping @param this_map and
   * @return the next value in the list (including wrap around).
   */
  this.getNextMappedValue = function(value, this_map) {
    if (this_map && mappings[this_map]) {
      var keys = Object.keys(mappings[this_map]);
      return keys[ (keys.indexOf( "" + value ) + 1) % keys.length ];
    }
    return value;
  }

  this.resetPageValues = function() {
    thisTemplateEngine.currentPage = null;
    thisTemplateEngine.currentPageUnavailableWidth=-1;
    thisTemplateEngine.currentPageUnavailableHeight=-1;
    thisTemplateEngine.currentPageNavbarVisibility=null;
  };
  
  this.getCurrentPageNavbarVisibility = function() {
    if (thisTemplateEngine.currentPageNavbarVisibility==null) {
      thisTemplateEngine.currentPageNavbarVisibility = thisTemplateEngine.pagePartsHandler.getNavbarsVisibility(thisTemplateEngine.currentPage);
    }
    return thisTemplateEngine.currentPageNavbarVisibility;
  };

  this.adjustColumns = function() {
    var data = $('#main').data();
    if (thisTemplateEngine.enableColumnAdjustment == false) {
      if (thisTemplateEngine.defaultColumns != data.columns) {
        data.columns = thisTemplateEngine.defaultColumns;
        return true;
      } else {
        return false;
      }
    }
    var width = thisTemplateEngine.getAvailableWidth();

    var newColumns = Math.ceil(width / thisTemplateEngine.minColumnWidth);
    if (newColumns > (thisTemplateEngine.defaultColumns / 2) && thisTemplateEngine.defaultColumns > newColumns) {
      // don´t accept values between 50% and 100% of defaultColumns
      // e.g if default is 12, then skip column-reduction to 10 and 8
      newColumns = thisTemplateEngine.defaultColumns;
    }
    else {
      // the value should be a divisor of defaultColumns-value
      while ((thisTemplateEngine.defaultColumns % newColumns)>0 && newColumns < thisTemplateEngine.defaultColumns) {
        newColumns++;
      }
      // make sure that newColumns does not exceed defaultColumns
      newColumns = Math.min(thisTemplateEngine.defaultColumns, newColumns);
    }
    if (newColumns != data.columns) {
        data.columns = newColumns;
      return true;
    } else {
      return false;
    }
  };
  
  /**
   * return the available width for a the currently visible page
   * the available width is calculated by subtracting the following elements widths (if they are visible) from the body width
   * - Left-Navbar
   * - Right-Navbar
   */
  this.getAvailableWidth = function() {
    // currently this calculation is done once after every page scroll (where thisTemplateEngine.currentPageUnavailableWidth is reseted)
    // if the screen width falls below the threshold which activates/deactivates the mobile.css
    // the calculation has to be done again, even if the page hasn´t changed (e.g. switching between portrait and landscape mode on a mobile can cause that)
    var bodyWidth = $('body').width();
    var mobileUseChanged = (lastBodyWidth<thisTemplateEngine.maxMobileScreenWidth)!=(bodyWidth<thisTemplateEngine.maxMobileScreenWidth);
    if (thisTemplateEngine.currentPageUnavailableWidth<0 || mobileUseChanged) {
//      console.log("Mobile.css use changed "+mobileUseChanged);
      thisTemplateEngine.currentPageUnavailableWidth=0;
      var navbarVisibility = thisTemplateEngine.getCurrentPageNavbarVisibility(thisTemplateEngine.currentPage);
      var widthNavbarLeft = navbarVisibility.left=="true" && $('#navbarLeft').css('display')!="none" ? Math.ceil( $('#navbarLeft').outerWidth() ) : 0;
      if (widthNavbarLeft>=bodyWidth) {
        // Left-Navbar has the same size as the complete body, this can happen, when the navbar has no content
        // maybe there is a better solution to solve this problem
        widthNavbarLeft = 0;
      }
      var widthNavbarRight = navbarVisibility.right=="true" && $('#navbarRight').css('display')!="none" ? Math.ceil( $('#navbarRight').outerWidth() ) : 0;
      if (widthNavbarRight>=bodyWidth) {
        // Right-Navbar has the same size as the complete body, this can happen, when the navbar has no content
        // maybe there is a better solution to solve this problem
        widthNavbarRight = 0;
      }
      thisTemplateEngine.currentPageUnavailableWidth = widthNavbarLeft + widthNavbarRight + 1; // remove an additional pixel for Firefox
//      console.log("Width: "+bodyWidth+" - "+widthNavbarLeft+" - "+widthNavbarRight);
    }
    lastBodyWidth = bodyWidth;
    return bodyWidth - thisTemplateEngine.currentPageUnavailableWidth;
  };
  
  /**
   * return the available height for a the currently visible page
   * the available height is calculated by subtracting the following elements heights (if they are visible) from the window height
   * - Top-Navigation
   * - Top-Navbar
   * - Bottom-Navbar
   * - Statusbar
   * 
   * Notice: the former way to use the subtract the $main.position().top value from the total height leads to errors in certain cases
   *         because the value of $main.position().top is not reliable all the time
   */
  this.getAvailableHeight = function(force) {
    var windowHeight = $(window).height();
    if (thisTemplateEngine.currentPageUnavailableHeight<0 || force==true) {
      thisTemplateEngine.currentPageUnavailableHeight=0;
      var navbarVisibility = thisTemplateEngine.getCurrentPageNavbarVisibility(thisTemplateEngine.currentPage);
      var heightStr = "Height: "+windowHeight;
      if ($('#top').css('display') != 'none' && $('#top').outerHeight(true)>0) {
        thisTemplateEngine.currentPageUnavailableHeight+= Math.max( $('#top').outerHeight(true), $('.nav_path').outerHeight(true) );
        heightStr+=" - "+Math.max( $('#top').outerHeight(true), $('.nav_path').outerHeight(true) );
      }
      else {
        heightStr+=" - 0";
      }
//      console.log($('#navbarTop').css('display')+": "+$('#navbarTop').outerHeight(true));
      if ($('#navbarTop').css('display') != 'none' && navbarVisibility.top=="true" && $('#navbarTop').outerHeight(true)>0) {
        thisTemplateEngine.currentPageUnavailableHeight+=$('#navbarTop').outerHeight(true);
        heightStr+=" - "+$('#navbarTop').outerHeight(true);
      }
      else {
        heightStr+=" - 0";
      }
      if ($('#navbarBottom').css('display') != 'none' && navbarVisibility.bottom=="true" && $('#navbarBottom').outerHeight(true)>0) {
        thisTemplateEngine.currentPageUnavailableHeight+=$('#navbarBottom').outerHeight(true);
        heightStr+=" - "+$('#navbarBottom').outerHeight(true);
      }
      else {
        heightStr+=" - 0";
      }
      if ($('#bottom').css('display') != 'none' && $('#bottom').outerHeight(true)>0) {
        thisTemplateEngine.currentPageUnavailableHeight+=$('#bottom').outerHeight(true);
        heightStr+=" - #bottom:"+$('#bottom').outerHeight(true);
      }
      else {
        heightStr+=" - 0";
      }
      if (thisTemplateEngine.currentPageUnavailableHeight>0) {
        thisTemplateEngine.currentPageUnavailableHeight+=1;// remove an additional pixel for Firefox
      }
      //console.log(heightStr);
      //console.log(windowHeight+" - "+thisTemplateEngine.currentPageUnavailableHeight);
    }
    return windowHeight - thisTemplateEngine.currentPageUnavailableHeight;
  };

  /*
   * Make sure everything looks right when the window gets resized. This is
   * necessary as the scroll effect requires a fixed element size
   */
  this.handleResize = function(resize, skipScrollFix) {
    var $main = $('#main');
    var width = thisTemplateEngine.getAvailableWidth();
    var height = thisTemplateEngine.getAvailableHeight();
    $main.css('width', width).css('height', height);
    $('#pageSize').text('.page{width:' + (width - 0) + 'px;height:' + height + 'px;}');
    if (this.mobileDevice) {
      //do nothing
    } else {
      if (($('#navbarTop').css('display')!="none" && $('#navbarTop').outerHeight(true)<=2)
          || ($('#navbarBottom').css('display')!="none" && $('#navbarBottom').innerHeight(true)<=2)) {
        // Top/Bottom-Navbar is not initialized yet, wait some time and recalculate available height
        // this is an ugly workaround, if someone can come up with a better solution, feel free to implement it
        setTimeout( thisTemplateEngine.handleResize, 100);
      }
    }
    if (skipScrollFix === undefined) {
      if (thisTemplateEngine.adjustColumns()) {
        // the amount of columns has changed -> recalculate the widgets widths
        thisTemplateEngine.applyColumnWidths();
      }
    }
  };
  
  this.rowspanClass = function(rowspan) {
    var className = 'rowspan rowspan' + rowspan;
    var styleId = className.replace(" ", "_") + 'Style';
    if (!$('#' + styleId).get(0)) {
      var dummyDiv = $(
          '<div class="clearfix" id="calcrowspan"><div id="containerDiv" class="widget_container"><div class="widget clearfix text" id="innerDiv" /></div></div>')
          .appendTo(document.body).show();

      var singleHeight = $('#containerDiv').outerHeight(false);
      var singleHeightMargin = $('#containerDiv').outerHeight(true);

      $('#calcrowspan').remove();

      // append css style
      $('head').append(
          '<style id="' + styleId + '">.rowspan.rowspan' + rowspan
              + ' { height: '
              + ((rowspan - 1) * singleHeightMargin + singleHeight)
              + 'px;} </style>').data(className, 1);
    }
    return className;
  };

  var pluginsToLoadCount = 0;
  var xml;
  this.parseXML = function(loaded_xml) {
    profileCV( 'parseXML' );
    xml = loaded_xml;
    // erst mal den Cache für AJAX-Requests wieder aktivieren
    /*
    $.ajaxSetup({
      cache : true
    });
    */

    /*
     * First, we try to get a design by url. Secondly, we try to get a predefined
     */
    // read predefined design in config
    var predefinedDesign = $('pages', xml).attr("design");

    if ($('pages', xml).attr("backend")) {
      thisTemplateEngine.backend = $('pages', xml).attr("backend");
    }
    thisTemplateEngine.initBackendClient();

    if( undefined === $('pages', xml).attr( 'scroll_speed' ) )
      thisTemplateEngine.scrollSpeed = 400;
    else
      thisTemplateEngine.scrollSpeed = $('pages', xml).attr('scroll_speed') | 0;
    
    var enableColumnAdjustment = null;
    if ($('pages', xml).attr('enable_column_adjustment')!=undefined) {
      enableColumnAdjustment = $('pages', xml).attr('enable_column_adjustment')=="true" ? true : false;
    }
    if ($('pages', xml).attr('bind_click_to_widget')!=undefined) {
      thisTemplateEngine.bindClickToWidget = $('pages', xml).attr('bind_click_to_widget')=="true" ? true : false;
    }
    if (enableColumnAdjustment) {
      thisTemplateEngine.enableColumnAdjustment = true;
    } else if (enableColumnAdjustment==null && /(android|blackberry|iphone|ipod|series60|symbian|windows ce|palm)/i
        .test(navigator.userAgent.toLowerCase())) {
      thisTemplateEngine.enableColumnAdjustment = true;
    }
    if ($('pages', xml).attr('default_columns')) {
      thisTemplateEngine.defaultColumns = $('pages', xml).attr('default_columns');
    }
    if ($('pages', xml).attr('min_column_width')) {
      thisTemplateEngine.minColumnWidth = $('pages', xml).attr('min_column_width');
    }
    thisTemplateEngine.screensave_time = $('pages', xml).attr('screensave_time');
    thisTemplateEngine.screensave_page = $('pages', xml).attr('screensave_page');

    // design by url
    if ($.getUrlVar("design")) {
      thisTemplateEngine.clientDesign = $.getUrlVar("design");
    }
    // design by config file
    else if (predefinedDesign) {
      thisTemplateEngine.clientDesign = predefinedDesign;
    }
    // selection dialog
    else {
      thisTemplateEngine.selectDesign();
    }
    if ($('pages', xml).attr('max_mobile_screen_width'))
      thisTemplateEngine.maxMobileScreenWidth = $('pages', xml).attr('max_mobile_screen_width');

    var getCSSlist = [ 'css!designs/designglobals.css'];
    if (thisTemplateEngine.clientDesign) {
      getCSSlist.push( 'css!designs/' + thisTemplateEngine.clientDesign + '/basic.css' );
      if (!thisTemplateEngine.forceNonMobile) {
        getCSSlist.push( 'css!designs/' + thisTemplateEngine.clientDesign + '/mobile.css' );
      }
      getCSSlist.push( 'css!designs/' + thisTemplateEngine.clientDesign + '/custom.css' );
      getCSSlist.push( 'designs/' + thisTemplateEngine.clientDesign + '/design_setup' );
    }
    require( getCSSlist, delaySetup('design') );

    // start with the plugins
    var pluginsToLoad = [];
    $('meta > plugins plugin', xml).each(function(i) {
      var name = $(this).attr('name');
      if (name) {
        if (!pluginsToLoad[name]) {
          /*
          pluginsToLoadCount++;
          $.includeScripts( 
              ['plugins/' + name + '/structure_plugin.js'],
              delaySetup( 'plugin_' + name)
            );
          pluginsToLoad[name] = true;
          */
          pluginsToLoad.push( 'plugins/' + name + '/structure_plugin' );
        }
      }
    });
    /*
    if (0 == pluginsToLoadCount) {
      delete loadReady.plugins;
    }
    */
    require( pluginsToLoad, delaySetup('plugins') );
    
    // then the icons
    $('meta > icons icon-definition', xml).each(function(i) {
      var $this = $(this);
      var name = $this.attr('name');
      var uri = $this.attr('uri');
      var type = $this.attr('type');
      var flavour = $this.attr('flavour');
      var color = $this.attr('color');
      var styling = $this.attr('styling');
      var dynamic = $this.attr('dynamic');
      icons.insert(name, uri, type, flavour, color, styling, dynamic);
    });

    // then the mappings
    $('meta > mappings mapping', xml).each(function(i) {
      var $this = $(this);
      var name = $this.attr('name');
      mappings[name] = {};
      var formula = $this.find('formula');
      if (formula.length > 0) {
        eval('var func = function(x){' + formula.text() + '; return y;}');
        mappings[name]['formula'] = func;
      }
      $this.find('entry').each(function() {
        var $localThis = $(this);
        var origin = $localThis.contents();
        var value = [];
        for (var i = 0; i < origin.length; i++) {
           var $v = $(origin[i]);
           if ($v.is('icon')) {
             value[i] = icons.getIcon($v.attr('name'), $v.attr('type'), $v.attr('flavour'), $v.attr('color'), $v.attr('styling'), $v.attr('class'));
           }
           else {
             value[i] = $v.text();
           }
        }
        // check for default entry
        var isDefaultValue = $localThis.attr('default');
        if (isDefaultValue != undefined) {
          isDefaultValue = isDefaultValue == "true";
        }
        else {
          isDefaultValue = false;
        }
        // now set the mapped values
        if ($localThis.attr('value')) {
          mappings[name][$localThis.attr('value')] = value.length == 1 ? value[0] : value;
          if (isDefaultValue) {
            mappings[name]['defaultValue'] = $localThis.attr('value');
          }
        }
        else {
          if (!mappings[name]['range']) {
            mappings[name]['range'] = {};
          }
          mappings[name]['range'][parseFloat($localThis.attr('range_min'))] = [ parseFloat($localThis.attr('range_max')), value ];
          if (isDefaultValue) {
            mappings[name]['defaultValue'] = parseFloat($localThis.attr('range_min'));
          }
        }
      });
    });

    // then the stylings
    $('meta > stylings styling', xml).each(function(i) {
      var name = $(this).attr('name');
      var classnames = '';
      stylings[name] = {};
      $(this).find('entry').each(function() {
        var $localThis = $(this);
        classnames += $localThis.text() + ' ';
        // check for default entry
        var isDefaultValue = $localThis.attr('default');
        if (isDefaultValue != undefined) {
          isDefaultValue = isDefaultValue == "true";
        } else {
          isDefaultValue = false;
        }
        // now set the styling values
        if ($localThis.attr('value')) {
          stylings[name][$localThis.attr('value')] = $localThis.text();
          if (isDefaultValue) {
            stylings[name]['defaultValue'] = $localThis.attr('value');
          }
        } else { // a range
          if (!stylings[name]['range'])
            stylings[name]['range'] = {};
          stylings[name]['range'][parseFloat($localThis.attr('range_min'))] = [parseFloat($localThis.attr('range_max')),$localThis.text()];
          if (isDefaultValue) {
            stylings[name]['defaultValue'] = parseFloat($localThis.attr('range_min'));
          }
        }
      });
      stylings[name]['classnames'] = classnames;
    });

    // then the status bar
    $('meta > statusbar status', xml).each(function(i) {
      var type = $(this).attr('type');
      var condition = $(this).attr('condition');
      var extend = $(this).attr('hrefextend');
      var sPath = window.location.pathname;
      var sPage = sPath.substring(sPath.lastIndexOf('/') + 1);

      // @TODO: make this match once the new editor is finished-ish.
      var editMode = 'edit_config.html' == sPage;

      // skip this element if it's edit-only and we are non-edit, or the other
      // way
      // round
      if (editMode && '!edit' == condition)
        return;
      if (!editMode && 'edit' == condition)
        return;

      var text = $(this).text();
      switch (extend) {
      case 'all': // append all parameters
        var search = window.location.search.replace(/\$/g, '$$$$');
        text = text.replace(/(href="[^"]*)(")/g, '$1' + search + '$2');
        break;
      case 'config': // append config file info
        var search = window.location.search.replace(/\$/g, '$$$$');
        search = search.replace(/.*(config=[^&]*).*|.*/, '$1');

        var middle = text.replace(/.*href="([^"]*)".*/g, '{$1}');
        if( 0 < middle.indexOf('?') )
          search = '&' + search;
        else
          search = '?' + search;

        text = text.replace(/(href="[^"]*)(")/g, '$1' + search + '$2');
        break;
      }
      $('.footer').html($('.footer').html() + text);
    });

    delete loadReady.page;
    setup_page();
  };
  
  /**
   * applies the correct width to the widgets corresponding to the given colspan setting 
   */
  this.applyColumnWidths = function() {
    // all containers
    ['#navbarTop', '#navbarLeft', '#main', '#navbarRight', '#navbarBottom'].forEach( function( area ){
      var 
        allContainer = $(area + ' .widget_container'),
        areaColumns = $( area ).data( 'columns' );
    allContainer.each(function(i, e) {
      var
        $e = $(e),
        data = thisTemplateEngine.widgetDataGet( e.id ),
        ourColspan = data.colspan;
      if (ourColspan < 0)
        return;
      var w = 'auto';
      if (ourColspan > 0) {
        var areaColspan = areaColumns || thisTemplateEngine.defaultColumns;
        w = Math.min(100, ourColspan / areaColspan * 100) + '%';
      }
      $e.css('width', w);
    });
    // and elements inside groups
    var adjustableElements = $('.group .widget_container');
    adjustableElements.each(function(i, e) {
      var 
        $e = $(e),
        data = thisTemplateEngine.widgetData[ e.id ],
        ourColspan = data.colspan;
      if (ourColspan < 0)
        return;
      if (ourColspan == undefined) {
        // workaround for nowidget groups
        ourColspan =  thisTemplateEngine.widgetDataGetByElement($e.children('.group')).colspan;
      }
      var w = 'auto';
      if (ourColspan > 0) {
        var areaColspan = areaColumns || thisTemplateEngine.defaultColumns;
        var groupColspan = Math.min(areaColspan, thisTemplateEngine.widgetDataGetByElement($e.parentsUntil(
            '.widget_container', '.group')).colspan);
        w = Math.min(100, ourColspan / groupColspan * 100) + '%'; // in percent
      }
      $e.css('width', w);
    });
    });
  };

  
  function setup_page() {
    // and now setup the pages
    profileCV( 'setup_page start' );

    // check if the page and the plugins are ready now
    for( var key in loadReady )  // test for emptines
      return; // we'll be called again...
      
    profileCV( 'setup_page running' );
 
    // as we are sure that the default CSS were loaded now:
    $('link[href*="mobile.css"]').each(function(){
      this.media = 'only screen and (max-width: ' + thisTemplateEngine.maxMobileScreenWidth + 'px)';
    });
    
    var page = $('pages > page', xml)[0]; // only one page element allowed...

    thisTemplateEngine.create_pages(page, 'id');
    profileCV( 'setup_page created pages' );
    
    var startpage = 'id_';
    if ($.getUrlVar('startpage')) {
      startpage = $.getUrlVar('startpage');
      if( typeof(Storage) !== 'undefined' )
      {
        if( 'remember' === startpage )
        {
          startpage = localStorage.getItem( 'lastpage' );
          rememberLastPage = true;
          if( 'string' !== typeof( startpage ) || 'id_' !== startpage.substr( 0, 3 ) )
            startpage = 'id_'; // fix obvious wrong data
        } else
        if( 'noremember' === startpage )
        {
          localStorage.removeItem( 'lastpage' );
          startpage = 'id_';
          rememberLastPage = false;
        }
      }
    }
    thisTemplateEngine.currentPage = $('#'+startpage);
    
    thisTemplateEngine.adjustColumns();
    thisTemplateEngine.applyColumnWidths();
    
    // Prevent elastic scrolling apart the main pane for iOS devices
    $(document).bind( 'touchmove', function(e) {
      e.preventDefault();
    });
    $('.page,#navbarTop>.navbar,#navbarBottom>.navbar').bind( 'touchmove', function(e) {
      var elem = $(e.currentTarget);
      var startTopScroll = elem.scrollTop();
      var startLeftScroll = elem.scrollLeft();
      
      // prevent scrolling of an element that takes full height and width
      // as it doesn't need scrolling
      if( (startTopScroll  <= 0) && (startTopScroll  + elem[0].offsetHeight >= elem[0].scrollHeight) &&
          (startLeftScroll <= 0) && (startLeftScroll + elem[0].offsetWidth  >= elem[0].scrollWidth ) )
      {
        return;
      }
      
      e.stopPropagation();
    });
    // stop the propagation if scrollable is at the end
    // inspired by https://github.com/joelambert/ScrollFix
    $('.page,#navbarTop>.navbar,#navbarBottom>.navbar').bind( 'touchstart', function(event) {
      var elem = $(event.currentTarget);
      var startTopScroll = elem.scrollTop();

      if(startTopScroll <= 0)
        elem.scrollTop(1);

      if(startTopScroll + elem[0].offsetHeight >= elem[0].scrollHeight)
        elem.scrollTop( elem[0].scrollHeight - elem[0].offsetHeight - 1 );
    });
    
    // setup the scrollable
    thisTemplateEngine.main_scroll = $('#main').scrollable({
      keyboard : false,
      touch : false
    }).data('scrollable');
    thisTemplateEngine.main_scroll.onSeek( function(){
      thisTemplateEngine.pagePartsHandler.updateTopNavigation( this );
      $('.activePage', '#pages').removeClass('activePage');
      $('.pageActive', '#pages').removeClass('pageActive');
      thisTemplateEngine.currentPage.addClass('pageActive activePage');// show new page
      $('#pages').css('left', 0 );
    });
    if (thisTemplateEngine.scrollSpeed != undefined) {
      thisTemplateEngine.main_scroll.getConf().speed = thisTemplateEngine.scrollSpeed;
    }
   
    thisTemplateEngine.scrollToPage(startpage,0);

    $('.fast').bind('click', function() {
      thisTemplateEngine.main_scroll.seekTo($(this).text());
    });

    // reaction on browser back button
    window.onpopstate = function(e) {
      // where do we come frome?
      lastpage = e.state;
      if (lastpage) {
        // browser back button takes back to the last page
        thisTemplateEngine.scrollToPage(lastpage, 0, true);
      }
    };

    // run the Trick-O-Matic scripts for great SVG backdrops
    $('embed').each(function() { this.onload =  Trick_O_Matic });
    
    if (thisTemplateEngine.enableAddressQueue) {
      // identify addresses on startpage
      var startPageAddresses = {};
      $('.actor','#'+startpage).each(function() {
    	  var $this = $(this),
          data  = $this.data();
    	  if( undefined === data.address ) data = $this.parent().data();
          for( var addr in data.address )
          {
            startPageAddresses[addr.substring(1)]=1;
          }
      });
      thisTemplateEngine.visu.setInitialAddresses(Object.keys(startPageAddresses));
    }
    var addressesToSubscribe = thisTemplateEngine.getAddresses();
    if( 0 == addressesToSubscribe.length )
      $(document).trigger( 'firstdata' ); // no data to receive => send event now
    else
      thisTemplateEngine.visu.subscribe(thisTemplateEngine.getAddresses());
    
    xml = null;
    delete xml; // not needed anymore - free the space
    $('.loading').removeClass('loading');
    fireLoadingFinishedAction();
    if( undefined !== thisTemplateEngine.screensave_time )
    {
      thisTemplateEngine.screensave = setTimeout( function(){thisTemplateEngine.scrollToPage();}, thisTemplateEngine.screensave_time*1000 );
      $(document).click( function(){
        clearInterval( thisTemplateEngine.screensave );
        thisTemplateEngine.screensave = setTimeout( function(){thisTemplateEngine.scrollToPage();}, thisTemplateEngine.screensave_time*1000 );
      });
    }
    profileCV( 'setup_page finish' );
  };

  this.create_pages = function(page, path, flavour, type) {
    var creator = thisTemplateEngine.design.getCreator(page.nodeName);
    var retval = creator.create(page, path, flavour, type);

    if( undefined === retval )
      return;
    
    var data = thisTemplateEngine.widgetDataGet( path );
    data.type = page.nodeName;
    retval = jQuery(
      '<div class="widget_container '
      + (data.rowspanClass ? data.rowspanClass : '')
      + ('break' === data.type ? 'break_container' : '') // special case for break widget
      + '" id="'+path+'"/>').append(retval);
    return retval;
  };

  this.scrollToPage = function(page_id, speed, skipHistory) {
    if( undefined === page_id )
      page_id = this.screensave_page;
    
    if (page_id.match(/^id_[0-9_]*$/) == null) {
      // find Page-ID by name
      var pages = $('.page h1:contains(' + page_id + ')', '#pages');
      if (pages.length>1 && thisTemplateEngine.currentPage!=null) {
        // More than one Page found -> search in the current pages descendants first
        var fallback = true;
        pages.each(function(i) {
          var p = $(this).closest(".page");
          if ($(this).text() == page_id) {
            if (p.attr('id').length<thisTemplateEngine.currentPage.attr('id').length) {
              // found pages path is shorter the the current pages -> must be an ancestor
              if (thisTemplateEngine.currentPage.attr('id').indexOf(p.attr('id'))==0) {
                // found page is an ancenstor of the current page -> we take this one
                page_id = p.attr("id");
                fallback = false;
                //break loop
                return false;
              }
            } else {
              if (p.attr('id').indexOf(thisTemplateEngine.currentPage.attr('id'))==0) {
                // found page is an descendant of the current page -> we take this one
                page_id = p.attr("id");
                fallback = false;
                //break loop
                return false;
              }
            }
          }
        });
        if (fallback) {
          // take the first page that fits (old behaviour)
          pages.each(function(i) {
            if ($(this).text() == page_id) {
              page_id = $(this).closest(".page").attr("id");
              // break loop
              return false;
            }
          });
        }
      } else {
        pages.each(function(i) {
          if ($(this).text() == page_id) {
            page_id = $(this).closest(".page").attr("id");
            // break loop
            return false;
          }
        });
      }
    }
//    console.log(thisTemplateEngine.currentPage);
//    // don't scroll when target is already active
//    if( thisTemplateEngine.currentPage!=null && thisTemplateEngine.currentPage.attr('id') === page_id )
//      return;
    
    var page = $('#' + page_id);
    
    if( 0 === page.length ) // check if page does exist
      return;
    
    if( undefined === speed )
      speed = thisTemplateEngine.scrollSpeed;
    
    if( rememberLastPage )
      localStorage.lastpage = page_id;
    
    thisTemplateEngine.resetPageValues();
    
    thisTemplateEngine.currentPage = page;

    page.addClass('pageActive activePage');// show new page
    
    // update visibility of navbars, top-navigation, footer
    thisTemplateEngine.pagePartsHandler.updatePageParts( page, speed );

    if( speed > 0 ) {
      var scrollLeft = page.position().left != 0;
      // jump to the page on the left of the page we need to scroll to
      if (scrollLeft) {
        $('#pages').css('left', -page.position().left + page.width());
      } else {
        $('#pages').css('left', -page.position().left - page.width());
      }
    }
    // push new state to history
    if (skipHistory === undefined)
      window.history.pushState(page_id, page_id, window.location.href);
    
    thisTemplateEngine.main_scroll.seekTo(page, speed); // scroll to it

    // show the navbars for this page
    /*
     * $('#'+page_id+'_top_navbar').addClass('navbarActive');
     * $('#'+page_id+'_right_navbar').addClass('navbarActive');
     * $('#'+page_id+'_bottom_navbar').addClass('navbarActive');
     * $('#'+page_id+'_left_navbar').addClass('navbarActive');
     */
    thisTemplateEngine.pagePartsHandler.initializeNavbars(page_id);

    $(window).trigger('scrolltopage', page_id);    
  };

  /*
   * Show a popup of type "type". The attributes is an type dependend object
   * This function returnes a jQuery object that points to the whole popup, so
   * it's content can be easily extended
   */
  this.showPopup = function(type, attributes) {
    return thisTemplateEngine.design.getPopup(type).create(attributes);
  };

  /*
   * Remove the popup. The parameter is the jQuery object returned by the
   * showPopup function
   */
  this.removePopup = function(jQuery_object) {
    jQuery_object.remove();
  };

  /** ************************************************************************* */
  /* FIXME - Question: should this belong to the VisuDesign object so that it */
  /* is possible to overload?!? */
  /** ************************************************************************* */
  this.refreshAction = function(target, src) {
    /*
     * Special treatment for (external) iframes: we need to clear it and reload
     * it in another thread as otherwise stays blank for some targets/sites and
     * src = src doesnt work anyway on external This creates though some
     * "flickering" so we avoid to use it on images, internal iframes and others
     */
    var parenthost = window.location.protocol + "//" + window.location.host;
    if (target.nodeName == "IFRAME" && src.indexOf(parenthost) != 0) {
      target.src = '';
      setTimeout(function() {
        target.src = src;
      }, 0);
    } else {
      target.src = src + '&' + new Date().getTime();
    }
  };

  this.setupRefreshAction = function() {
    var refresh = $(this).data('refresh');
    if (refresh && refresh > 0) {
      var target = $('img', $(this))[0] || $('iframe', $(this))[0];
      var src = target.src;
      if (src.indexOf('?') < 0)
        src += '?';
      $(this).data('interval', setInterval(function() {
        thisTemplateEngine.refreshAction(target, src);
      }, refresh));
    }
  };

  this.selectDesign = function() {
    $body = $("body");

    $("body > *").hide();
    $body.css({
      backgroundColor : "black"
    });

    $div = $("<div id=\"designSelector\" />");
    $div.css({
      background : "#808080",
      width : "400px",
      color : "white",
      margin : "auto",
      padding : "0.5em"
    });
    $div.html("Loading ...");

    $body.append($div);

    $.getJSON("./designs/get_designs.php",function(data) {
      $div.empty();

      $div.append("<h1>Please select design</h1>");
      $div.append("<p>The Location/URL will change after you have chosen your design. Please bookmark the new URL if you do not want to select the design every time.</p>");

      $.each(data,function(i, element) {
        var $myDiv = $("<div />");

        $myDiv.css({
          cursor : "pointer",
          padding : "0.5em 1em",
          borderBottom : "1px solid black",
          margin : "auto",
          width : "262px",
          position : "relative"
        });

        $myDiv
        .append("<div style=\"font-weight: bold; margin: 1em 0 .5em;\">Design: "
            + element + "</div>");
        $myDiv
        .append("<iframe src=\"designs/design_preview.html?design="
            + element
            + "\" width=\"160\" height=\"90\" border=\"0\" scrolling=\"auto\" frameborder=\"0\" style=\"z-index: 1;\"></iframe>");
        $myDiv
        .append("<img width=\"60\" height=\"30\" src=\"./config/media/arrow.png\" alt=\"select\" border=\"0\" style=\"margin: 60px 10px 10px 30px;\"/>");

        $div.append($myDiv);

        var $tDiv = $("<div />");
        $tDiv.css({
          background : "transparent",
          position : "absolute",
          height : "90px",
          width : "160px",
          zIndex : 2
        });
        var pos = $myDiv.find("iframe").position();
        $tDiv.css({
          left : pos.left + "px",
          top : pos.top + "px"
        });
        $myDiv.append($tDiv);

        $myDiv.hover(function() {
          // over
          $myDiv.css({
            background : "#bbbbbb"
          });
        }, function() {
          // out
          $myDiv.css({
            background : "transparent"
          });
        });

        $myDiv.click(function() {
          if (document.location.search == "") {
            document.location.href = document.location.href
            + "?design=" + element;
          } else {
            document.location.href = document.location.href
            + "&design=" + element;
          }
        });
      });
    });
  };

  // tools for widget handling
  /**
   * Return a widget (to be precise: the widget_container) for the given path
   */
  this.lookupWidget = function( path ) {
    var id = path.split( '_' );
    var elementNumber = +id.pop();
    return $( '.page#' + id.join('_') ).children().children()[ elementNumber+1 ];
  };
  
  this.getParentPage = function(page) {
    if (0 === page.length) return null;

    return getParentPageById(page.attr('id'), true);
  };

  function getParentPageById(path, isPageId) {
    if (0 < path.length) {
      var pathParts = path.split('_');
      if (isPageId) pathParts.pop();
      while (pathParts.length > 1) {
        pathParts.pop();
        var path = pathParts.join('_') + '_';
        if ($('#' + path).hasClass("page")) {
          return $('#' + path);
        }
      }
    }
    return null;
  };

  this.getParentPageFromPath = function(path) {
    return getParentPageById(path, false);
  };
  
  /**
   * Load a script and run it before page setup.
   * This is needed for plugin that depend on an external library.
   */
  this.getPluginDependency = function( url ){
    $.getScriptSync( url );
  }

  /**
   * This has to be called by a plugin once it was loaded.
   */
  this.pluginLoaded = function(){
    pluginsToLoadCount--;
    if( 0 >= pluginsToLoadCount )
    {
      delete loadReady.plugins;
      setup_page();
    }
  }
  
  /**
   * Create a new widget.
   */
  this.create = function( path, element ) {
    return "created widget '" + path + "': '" + element + "'";
  };
  
  /**
   * Delete an existing path, i.e. widget, group or even page - including 
   * child elements.
   */
  this.deleteCommand = function( path ) {
    console.log( this.lookupWidget( path ), $( '#'+path ) );
    //$( this.lookupWidget( path ) ).remove();
    return "deleted widget '" + path + "'";
  };
  
  /**
   * Focus a widget.
   */
  this.focus = function( path ) {
    $('.focused').removeClass('focused')
    $( this.lookupWidget( path ) ).addClass( 'focused' );
  };
  
  ////////// Reflection API for possible Editor communication: Start //////////
  /**
   * Return a list of all widgets.
   */
  this.list = function() {
    var widgetTree = {};
    $('.page').each( function(){
      var id = this.id.split( '_' );
      var thisEntry = widgetTree;
      if( 'id' === id.shift() )
      {
        var thisNumber;
        while( thisNumber = id.shift() )
        {
          if( !(thisNumber in thisEntry) )
            thisEntry[ thisNumber ] = {};
          
          thisEntry = thisEntry[ thisNumber ];
        }
        $( this ).children().children( 'div.widget_container' ).each( function( i ){
          if( undefined === thisEntry[ i ] )
          {
            thisEntry[ i ] = {}
          }
          var thisWidget = $( this ).children()[0];
          thisEntry[ i ].name = ('className' in thisWidget) ? thisWidget.className : 'TODO';
          thisEntry[ i ].type = $(this).data('type');
        });
      }
    });
    return widgetTree;
  };
  
  /**
   * Return all attributes of a widget.
   */
  this.read = function( path ) {
    var widget = this.lookupWidget( path ),
        data   = $.extend( {}, $( widget ).children().data() ); // copy
    delete data.basicvalue;
    delete data.value;
    return data;
  };
  
  /**
   * Set the selection state of a widget.
   */
  this.select = function( path, state ) {
    var container = this.lookupWidget( path )
    if( state )
      $( container ).addClass( 'selected');
    else
      $( container ).removeClass( 'selected');
  };
  
  /**
   * Set all attributes of a widget.
   */
  this.write = function( path, attributes ) {
    $( this.lookupWidget( path ) ).children().data( attributes );
  };
  
  /**
   * Reflection API: communication
   * Handle messages that might be sent by the editor
   */
  this.handleMessage = function( event ) {
    // prevend bad or even illegal requests
    if( event.origin  !== window.location.origin ||
        'object'      !== typeof event.data      ||
        !('command'    in event.data )           ||
        !('parameters' in event.data )
    )
      return;
    
    var answer     = 'bad command',
        parameters = event.data.parameters;
    
    // note: as the commands are from external, we have to be a bit more
    //       carefull for corectness testing
    switch( event.data.command )
    {
      case 'create':
        if( 'object'  === typeof parameters   &&
            pathRegEx.test( parameters.path ) &&
            'string' === typeof parameters.element
        )
          answer = thisTemplateEngine.create( parameters.path, parameters.element );
        else 
          answer = 'bad path or element';
        break;
        
      case 'delete':
        if( pathRegEx.test( parameters ) ) 
          answer = thisTemplateEngine.deleteCommand( parameters );
        else 
          answer = 'bad path';
        break;
        
      case 'focus':
        if( pathRegEx.test( parameters ) ) 
          answer = thisTemplateEngine.focus( parameters );
        else 
          answer = 'bad path';
        break;
        
      case 'list':
        answer = thisTemplateEngine.list();
        break;
        
      case 'read':
        if( pathRegEx.test( parameters ) ) 
          answer = thisTemplateEngine.read( parameters );
        else 
          answer = 'bad path';
        break;
        
      case 'select':
        if( 'object'  === typeof parameters   &&
            pathRegEx.test( parameters.path ) &&
            'boolean' === typeof parameters.state
        )
          answer = thisTemplateEngine.select( parameters.path, parameters.state );
        break;
        
      case 'write':
        if( 'object'  === typeof parameters   &&
            pathRegEx.test( parameters.path ) &&
            'object'  === typeof parameters.attributes 
        )
          answer = thisTemplateEngine.write( parameters.path, parameters.attributes );
        break;
    }
    
    event.source.postMessage( answer, event.origin );
  };
  window.addEventListener( 'message', this.handleMessage, false);
  ////////// Reflection API for possible Editor communication: End //////////
}

  }); // end require
