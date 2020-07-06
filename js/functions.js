var chargepoint;
var email;
var ocpp;
var url = "http://192.168.188.36:8080";

function santize(str) {
  str = str.replace(/[^a-z0-9@\.,_-]/gi,"");
  return str.trim();
}

function hijack() {
     $('#viewport a').click(function(e){
          e.preventDefault();
          loadPage(e.target.href);
          })
}

function loadPage(url){
   $('#viewport').load(url + '#viewport', hijack);
}

function loadCPs() {
  $.getJSON(url + "/steve/api", function(data) {
    var items = [];
    $("#cpTable").empty();
    $("#cpContainer").addClass("invisible");
    $.each(data, function(key, val) {
      var color = colorAvailability(val[1]);
      items.push("<tr id=\"overview_" + val[0] + "\" class=\"" + color
      + "\"><td onMouseOver=\"this.style.cursor=\'pointer\'\" onclick=\"loadDetails(\'" + val[0] + "\')\">"
      + val[0] + "</td><td id=\"state_" + val[0] + "\" onMouseOver=\"this.style.cursor=\'pointer\'\" onclick=\"loadDetails(\'"
      + val[0] + "\')\">" + statusName(val[1]) + "</td>");
    });
    $("#cpTable").append(items);
  });
}

function colorAvailability(avail){
  var color;
  switch (avail) {
    case "Available":
      color = "table-success";
      break;
    case "Preparing":
    case "SuspendedEV":
    case "Finishing":
      color = "table-warning";
      break;
    case "Charging":
      color = "table-primary";
      break;
    case "Unavailable":
      color = "table-active";
      break;
    default:
      color = "table-danger";
  }
  return color;
}
function statusName(status) {
  var returnStatus;
  switch (status) {
    case "Available":
      returnStatus = "Verfügbar";
      break;
    case "Preparing":
      returnStatus = "Belegt - Auto angeschlossen";
      break;
    case "SuspendedEV":
      returnStatus = "Belegt - Angehalten";
      break;
    case "Finishing":
      returnStatus = "Belegt - Wird beendet";
      break;
    case "Charging":
      returnStatus = "Am Laden";
      break;
    case "Unavailable":
      returnStatus = "Nicht verfügbar";
      break;
    case "SuspendedEVSE":
      returnStatus = "Ladepunkt N/V";
      break;
    default:
      returnStatus = "Fehler";
  }
  return returnStatus;
}

function loadDetails(pChargepoint) {
  chargepoint = pChargepoint;
  $.getJSON(url + "/steve/api/" + chargepoint + "/")
    .done(function(data) {
    //$("#cpDetails").empty();
    var details = [];
    $.each(data, function(key, value) {
      if(!value) {
        details.push("");
      } else {
        details.push(value)
      }
    });
    if(details[11] == "Charging") {
      $("#btnStart").addClass("disabled");
      $("#btnStart").prop('disabled', true);
      $("#btnStop").removeClass("disabled");
      $("#btnStop").prop('disabled', false);
    } else if (details[11] == "Unavailable"){
      $("#btnStart").addClass("disabled");
      $("#btnStart").prop('disabled', true);
      $("#btnStop").removeClass("disabled");
      $("#btnStop").prop('disabled', true);
    } else {
      $("#btnStart").removeClass("disabled");
      $("#btnStart").prop('disabled', false);
      $("#btnStop").addClass("disabled");
      $("#btnStop").prop('disabled', true);
    }
    $("#details-cp").text(details[0]);
    $("#details-avail").text(statusName(details[11]));
    $("#details-vendor").text(details[1]);
    $("#details-model").text(details[2]);
    $("#details-sn").text(details[3]);
    $("#details-meter").text(details[4]);
    $("#details-metersn").text(details[5]);
    $("#details-notes").text(details[6]);
    $("#details-description").text(details[7]);
    $("#details-coordinates").text(details[8] + ", " + details[9]);
    $("#details-address").text(details[10]);
    $("#cpContainer").removeClass("invisible");
  });
}

function startCharge(){
  $.ajaxSetup({
    async: false
  });
  $.getJSON(url + "/steve/api/" + chargepoint + "/startSession/" + localStorage.getItem("ocpp"), function(data) {
    if (data == "Accepted") {
      alert("Ladung gestartet");
      $("#btnStart").addClass("disabled");
      $("#btnStart").prop('disabled', true);
      $("#btnStop").removeClass("disabled");
      $("#btnStop").prop('disabled', false);
      $("#details-avail").text("Am Laden");
      $("#overview_" + chargepoint).removeClass("table-warning");
      $("#overview_" + chargepoint).removeClass("table-success");
      $("#overview_" + chargepoint).addClass("table-primary");
      $("#state_" + chargepoint).text("Am Laden")

    } else {
      alert("Ladevorgang konnte nicht gestartet werden!")
    }
  });
}

function stopCharge(){
  $.ajaxSetup({
    async: false
  });
  $.getJSON(url + "/steve/api/" + chargepoint + "/stopSession/" + localStorage.getItem("ocpp"),function() {
    console.log("Stop sesison");
  })
  .done(function(data) {
    if (data == "Accepted") {
      alert("Ladung wird gestoppt!");
      $("#btnStart").removeClass("disabled");
      $("#btnStart").prop('disabled', false);
      $("#btnStop").addClass("disabled");
      $("#btnStop").prop('disabled', true);
      loadCPs();
    } else {
      alert("Ladevorgang konnte nicht gestoppt werden!")
    }
  })
  .fail(function( jqxhr, textStatus, error ) {
    switch(jqxhr.status) {
      case 403:
        $("#mainContainer")
          .append('<div class="alert alert-danger" role="alert" id="alert403">Fremde Ladevorg&auml;nge k&ouml;nnen nicht beendet werden!'
          + '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span>'
          + '</button></div>');
        break;
      case 409:
      $("#mainContainer")
        .append('<div class="alert alert-danger" role="alert">Ladevorgang kann nicht beendet werden!'
        + '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span>'
        + '</button></div>');
      break;
    }
  });
}

function login(e){
  e.preventDefault();
  email = $("#email").val();
  ocpp = santize($("#password").val());
  $.ajaxSetup({
    async: false,
    timeout: 3000
  });
  $.getJSON(url + "/steve/api/user_login?email=" + email + "&id=" + ocpp, function() {console.log("success")})
    .done(function(data){
      if(data!="false") {
        console.log("done")
        localStorage.setItem("email",email);
        localStorage.setItem("ocpp",ocpp);
        localStorage.setItem("loggedin",true);
        location.replace("overview.html");
        //window.location = "overview.html";
        //loadCPs();
        return true;
      } else {+
        localStorage.setItem("loggedin",false);
        if(!$("#Alert").length){
          var failure = "<div class=\"alert alert-danger\" role=\"alert\" id=\"loginAlert\">"
                          + "Login falsch!</div>";
          $("#loginform").prepend(failure);
          return false;
        }
      }
  })
  .fail(function() {
    console.log("fail");
    localStorage.setItem("loggedin",false);
    if(!$("#loginAlert").length){
      var failure = "<div class=\"alert alert-danger\" role=\"alert\" id=\"loginAlert\">"
                      + "Login falsch!</div>";
      $("#loginform").prepend(failure);
    }
    return false;
  });
  //return false;
}
function checklogged() {
  if(localStorage.getItem("loggedin") == "true") {
    return true;
  } else {
    location.replace("index.html");
  }
}
function logout() {
  localStorage.clear();
  window.location.replace("index.html");
  return true;
}

function getTokenList() {
  ocpp = localStorage.getItem("ocpp");
  $.getJSON(url + "/steve/api/getTokens?id=" + ocpp, function(data){
    // Tokenliste
    tokenliste = data;
  });
}
function fillTokenList() {
  ocpp = localStorage.getItem("ocpp");
  var tokenliste;
  $.getJSON(url + "/steve/api/getTokens?id=" + ocpp, function(data){
    // Tokenliste
    tokenliste = data;
    $("#tokenListe").empty();
    $.each(tokenliste, function(index, val) {
      if(val[0]!=ocpp) {
        $("#tokenListe").append(getTokenRow(val));
      }
    })
  });
}

function addNewToken(){
  ocpp = localStorage.getItem("ocpp");
  var newToken = santize($("#newToken").val());
  var newTokenNote = santize($("#newTokenNote").val());
  var dataString = "id=" + ocpp + "&token=" + newToken
  if(newTokenNote) {
     dataString = dataString.concat("&note=" + newTokenNote);
  }
  $.ajax({
    url: url + "/steve/api/addToken?" + dataString,
    method: "PUT"
    })
    .done(function() {
      var tokenArray = [newToken, newTokenNote];
      $("#tokenListe").append(getTokenRow(tokenArray));
    })
    .fail(function alarm() {
      alert("Das Token kann nicht hinzugefügt werden!");
    });
    return false;
}

function deleteToken(){
  var selectedToken = $("input[name='token']:checked").attr("id");
  $.ajax({
    url: url + "/steve/api/removeToken?tokenID=" + selectedToken,
    method: "DELETE",
    async: false
    })
    .done(fillTokenList())
    .fail(function alarm() {
      alert("Das Token kann nicht gelöscht werden!");
    });
}

function fillTokenListForCDR() {
  // TokenListe füllen
  ocpp = localStorage.getItem("ocpp");
  var tokenliste;
  $.getJSON(url + "/steve/api/getTokens?id=" + ocpp, function(data){
    // Tokenliste
    tokenliste = data;
    $("#tokenList").empty();
    $("#tokenList").append($('<option>', {
      value: "ALL",
      text: 'Alle'
    }));
    $.each(tokenliste, function(index, val) {
      $("#tokenList").append($('<option>', {
          value: val[0],
          text : val[0]
      }));
    });
    $.getJSON(url + "/steve/api/getStatistics?tokenID=" + ocpp
      + "&period=LAST_10&allStatistics=true", function(data){
        $("#cdrContainer").empty();
        $.each(Object.keys(data).reverse(), function(index, val) {
            $("#cdrContainer").append(getChargingDataString(data[val]));
        })
    });
  });

}

function getTokenRow(token) {
  var tableRow =
  '<tr onclick="activateBtn(\''+ token[0] +'\')">'
    + '<td><input type="radio" name="token" id="' + token[0] + '"/></td>'
    + '<td id="token_' + token[0] +'">' + token[0] + '</td>'
    + '<td id="note_' + token[0] + '">' + token[1] + '</td>'
  + '</tr>';
  return tableRow;
}

function activateBtn(token) {
  var elem = "#" + token;
  $(elem).prop("checked", true);
  $("#removeTokenBtn").prop("disabled", false);
}

function getCDRs() {
  var timespan = $("#timespan").children("option:selected").val();
  var token = $("#tokenList").children("option:selected").val();
  var stats = false;
  if(token == "ALL") {
    stats = true;
    token = sessionStorage.getItem("ocpp");
  }
  $.getJSON(url + "/steve/api/getStatistics?tokenID=" + token
    + "&period=" + timespan + "&allStatistics=" + stats, function(data){
      $("#cdrContainer").empty();
      $.each(Object.keys(data).reverse(), function(index, val) {
          $("#cdrContainer").append(getChargingDataString(data[val]));
      })
  });
}

function getChargingDataString(cdr) {
  var enddate = new Date(cdr[6]);

  var str = '<div class=\"card\">'
    + '<div class="card-header p-1">'  + enddate.toLocaleString("de-DE")+ '</div>'
    +'<div class="card-body bg-light p-1">'
    +'<div class="table-responsive">'
      +'<table class="table table-bordered table-sm">'
        +'<thead class="thead-light">'
          +'<tr>'
          +  '<th scope="col">Ladepunkt</th>'
          +  '<th scope="col">Adresse</th>'
          +  '<th scope="col">Token</th>'
          +  '<th scope="col">Energiemenge</th>'
          +'</tr>'
        +'</thead>'
        +'<tbody>'
        +'  <tr>'
        +'    <td data-title="Ladepunkt">' + cdr[1] + '</td>'
        +'    <td data-title="Adresse">' + cdr[2] + '</td>'
        +'    <td data-title="Token">' + cdr[3] + '</td>'
        +'    <td data-title="Energiemenge">' + cdr[9] + ' ' + cdr[10] + '</td>'
        +'  </tr>'
        +'</tbody>'
      +'</table>'
    +'</div>'
  +'</div></div><br />';
  return str;
}
