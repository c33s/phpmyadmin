/* vim: set expandtab sw=4 ts=4 sts=4: */
/**
 * JavaScript functions used on Database Search page
 *
 * @requires    jQuery
 * @requires    js/functions.js
 *
 * @package PhpMyAdmin
 */

/**
 * AJAX script for the Database Search page.
 *
 * Actions ajaxified here:
 * Retrieve result of SQL query
 */

/**
 * Loads the database search results
 *
 * @param result_path Url of the page to load
 * @param table_name  Name of table to browse
 * @param ajaxEnable  Whether to use ajax or not
 *
 * @return nothing
 */
function loadResult(result_path, table_name, link, ajaxEnable)
{
    $(document).ready(function() {
        if(ajaxEnable) {
            /**   Hides the results shown by the delete criteria */
            var $msg = PMA_ajaxShowMessage();
            $('#sqlqueryform').hide();
            $('#togglequerybox').hide();
            /**  Load the browse results to the page */
            $("#table-info").show();
            $('#table-link').attr({"href" : 'sql.php?'+link }).text(table_name);
            var url = result_path + " #sqlqueryresults";
            $('#browse-results').load(url, null, function() {
                $('html, body')
                    .animate({
                        scrollTop: $("#browse-results").offset().top
                    }, 1000);
                PMA_ajaxRemoveMessage($msg);
                // because under db_search, window.parent.table is not defined yet,
                // we assign it manually from #table-link
                window.parent.table = $('#table-link').text().trim();
                PMA_makegrid($('#table_results')[0], true, true, true, true);
            }).show();
        } else {
            event.preventDefault();
        }
    });
}

/**
 *  Delete the selected search results
 *
 * @param result_path Url of the page to load
 * @param msg         Text for the confirmation dialog
 * @param ajaxEnable  Whether to use ajax or not
 *
 * @return nothing
 */
function deleteResult(result_path, msg, ajaxEnable)
{
    $(document).ready(function() {
        /**  Hides the results shown by the browse criteria */
        $("#table-info").hide();
        $('#browse-results').hide();
        $('#sqlqueryform').hide();
        $('#togglequerybox').hide();
        /** Conformation message for deletion */
        if(confirm(msg)) {
            if(ajaxEnable) {
                var $msg = PMA_ajaxShowMessage(PMA_messages['strDeleting'], false);
                /** Load the deleted option to the page*/
                $('#sqlqueryform').html('');
                var url = result_path + " #result_query, #sqlqueryform";
                $('#browse-results').load(url, function () {
                    /** Refresh the search results after the deletion */
                    document.getElementById('buttonGo').click();
                    $('#togglequerybox').html(PMA_messages['strHideQueryBox']);
                    PMA_ajaxRemoveMessage($msg);
                    /** Show the results of the deletion option */
                    $('#browse-results').show();
                    $('#sqlqueryform').show();
                    $('#togglequerybox').show();
                });
            } else {
                event.preventDefault();
            }
       }
    });
}

$(document).ready(function() {
    /**
     * Set a parameter for all Ajax queries made on this page.
     * Don't let the web server serve cached pages
     */
    $.ajaxSetup({
        cache: 'false'
    });

    /** Hide the table link in the initial search result */
    var icon = PMA_getImage('s_tbl.png', '', {'id': 'table-image'}).toString();
    $("#table-info").prepend(icon).hide();

    /** Hide the browse and deleted results in the new search criteria */
    $('#buttonGo').click(function(){
        $("#table-info").hide();
        $('#browse-results').hide();
        $('#sqlqueryform').hide();
        $('#togglequerybox').hide();
    });
    /**
     * Prepare a div containing a link for toggle the search results
     */
    $('<div id="togglesearchresultsdiv"><a id="togglesearchresultlink"></a></div>')
    .insertAfter('#searchresults')
    /** don't show it until we have results on-screen */
    .hide();

    $('<br class="clearfloat" />').insertAfter("#togglesearchresultsdiv").show();
    /**
     * Changing the displayed text according to
     * the hide/show criteria in search result forms
     */
    $('#togglesearchresultlink')
    .html(PMA_messages['strHideSearchResults'])
    .bind('click', function() {
         var $link = $(this);
         $('#searchresults').slideToggle();
         if ($link.text() == PMA_messages['strHideSearchResults']) {
             $link.text(PMA_messages['strShowSearchResults']);
         } else {
             $link.text(PMA_messages['strHideSearchResults']);
         }
         /** avoid default click action */
         return false;
    });

    /**
     * Prepare a div containing a link for toggle the search form,
     * otherwise it's incorrectly displayed after a couple of clicks
     */
    $('<div id="togglesearchformdiv"><a id="togglesearchformlink"></a></div>')
    .insertAfter('#db_search_form')
    .hide(); // don't show it until we have results on-screen

    /**
     * Changing the displayed text according to
     * the hide/show criteria in search form
     */
    $("#togglequerybox").hide();
    $("#togglequerybox").bind('click', function() {
        var $link = $(this);
        $('#sqlqueryform').slideToggle("medium");
        if ($link.text() == PMA_messages['strHideQueryBox']) {
            $link.text(PMA_messages['strShowQueryBox']);
        } else {
            $link.text(PMA_messages['strHideQueryBox']);
        }
        /** avoid default click action */
        return false;
    });

    /** don't show it until we have results on-screen */

   /**
    * Changing the displayed text according to
    * the hide/show criteria in search criteria form
    */
   $('#togglesearchformlink')
       .html(PMA_messages['strShowSearchCriteria'])
       .bind('click', function() {
            var $link = $(this);
            $('#db_search_form').slideToggle();
            if ($link.text() == PMA_messages['strHideSearchCriteria']) {
                $link.text(PMA_messages['strShowSearchCriteria']);
            } else {
                $link.text(PMA_messages['strHideSearchCriteria']);
            }
            /** avoid default click action */
            return false;
       });
    /**
     * Ajax Event handler for retrieving the result of an SQL Query
     * (see $GLOBALS['cfg']['AjaxEnable'])
     *
     * @see     $GLOBALS['cfg']['AjaxEnable']
     */
    $("#db_search_form.ajax").live('submit', function(event) {
        event.preventDefault();

        var $msgbox = PMA_ajaxShowMessage(PMA_messages['strSearching'], false);
        // jQuery object to reuse
        $form = $(this);

        PMA_prepareForAjaxRequest($form);

        var url = $form.serialize() + "&submit_search=" + $("#buttonGo").val();
        $.post($form.attr('action'), url, function(response) {
            if (typeof response == 'string') {
                // found results
                $("#searchresults").html(response);

                $('#togglesearchresultlink')
                // always start with the Show message
                .text(PMA_messages['strHideSearchResults'])
                $('#togglesearchresultsdiv')
                // now it's time to show the div containing the link
                .show();
                $('#searchresults').show();


                $('#db_search_form')
                    // workaround for Chrome problem (bug #3168569)
                    .slideToggle()
                    .hide();
                $('#togglesearchformlink')
                    // always start with the Show message
                    .text(PMA_messages['strShowSearchCriteria'])
                $('#togglesearchformdiv')
                    // now it's time to show the div containing the link
                    .show();
            } else {
                // error message (zero rows)
                $("#sqlqueryresults").html(response['message']);
            }

            PMA_ajaxRemoveMessage($msgbox);
        })
    })
}, 'top.frame_content'); // end $(document).ready()