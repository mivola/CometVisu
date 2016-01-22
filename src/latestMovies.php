<?php
	//http://openelec/jsonrpc?request={"jsonrpc": "2.0", "method": "VideoLibrary.GetRecentlyAddedMovies", "id": 1}
    $url="http://openelec/jsonrpc?request={%22jsonrpc%22:%20%222.0%22,%20%22method%22:%20%22VideoLibrary.GetRecentlyAddedMovies%22,%20%22id%22:%201}";

    $json = file_get_contents($url);
    $data = json_decode($json, TRUE);

    echo "<!DOCTYPE HTML PUBLIC '-//W3C//DTD HTML 4.01 Transitional//EN'>";
	echo "<html>";
	echo "<head>";
	echo "<link rel=\"stylesheet\" type=\"text/css\" href=\"http://wiregate302/visu.git/designs/designglobals.css\">";
	echo "<link rel=\"stylesheet\" type=\"text/css\" href=\"http://wiregate302/visu.git/designs/metal/basic.css\">";
	echo "<link media=\"only screen and (max-width: 480px)\" rel=\"stylesheet\" type=\"text/css\" href=\"http://wiregate302/visu.git/designs/metal/mobile.css\">";
	echo "<link rel=\"stylesheet\" type=\"text/css\" href=\"http://wiregate302/visu.git/designs/metal/custom.css\">";
	echo "</head>";
	echo "<title>Filme</title>";

    foreach($data['result']['movies'] as $item) {
    	//http://openelec/jsonrpc?request={"jsonrpc": "2.0", "method": "VideoLibrary.GetMovieDetails", "params": {"movieid": 238, "properties": ["dateadded", "lastplayed", "playcount"]}, "id": 1}
		$urlDetails="http://openelec/jsonrpc?request={%22jsonrpc%22:%20%222.0%22,%20%22method%22:%20%22VideoLibrary.GetMovieDetails%22,%20%22params%22:%20{%22movieid%22:%20".$item['movieid'].",%20%22properties%22:%20[%22dateadded%22,%20%22lastplayed%22,%20%22playcount%22]},%20%22id%22:%201}";

	    $jsonDetails = file_get_contents($urlDetails);
	    $dataDetails = json_decode($jsonDetails, TRUE);
	    
	    if (utf8_decode($dataDetails['result']['moviedetails']['playcount'] == "0")) {
	    	print "<div class=\"widget_container group\">";
		    print substr(utf8_decode($dataDetails['result']['moviedetails']['dateadded']), 0, 10);
		    print " - ";
		//    print utf8_decode ($item['movieid']);
		//    print " - ";
		//    print utf8_decode ($dataDetails['result']['moviedetails']['playcount']);
		//    print " - ";
		    print utf8_decode ($item['label']);
		    print '</div><br>';	
	    }
	    
	}

	echo "</table>";
	echo "</body>";

?>