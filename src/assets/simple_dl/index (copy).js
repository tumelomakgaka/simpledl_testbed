exports.loadXML = function loadXML()
{
    if (window.XMLHttpRequest)
    {
        xhttp=new XMLHttpRequest();
    }
    else
    {
        xhttp=new ActiveXObject("Microsoft.XMLHTTP");
    }
    xhttp.open("GET","./assets/simple_dl/contact.xml",false);
    xhttp.send();
    xmlDoc = xhttp.responseXML;
    exports.searchXML(xmlDoc)
    return xhttp.responseXML;
}

exports.searchXML = function searchXML(xmlDoc)
{
    var divText = ""
    x = xmlDoc.getElementsByTagName("firstname");
    firstname=xmlDoc.getElementsByTagName("firstname")[0].childNodes[0].nodeValue;
    input = "Bob";
    size = input.length; 
    for (i=0;i<x.length;i++)
    {
        if (firstname.toLowerCase() == input.toLowerCase())
        {
            firstname=xmlDoc.getElementsByTagName("firstname")[i].childNodes[0].nodeValue;
            lastname=xmlDoc.getElementsByTagName("lastname")[i].childNodes[0].nodeValue;
            phone=xmlDoc.getElementsByTagName("phone")[i].childNodes[0].nodeValue;
            street=xmlDoc.getElementsByTagName("street")[i].childNodes[0].nodeValue;
            city=xmlDoc.getElementsByTagName("city")[i].childNodes[0].nodeValue;
            state=xmlDoc.getElementsByTagName("state")[i].childNodes[0].nodeValue;
            postcode=xmlDoc.getElementsByTagName("postcode")[i].childNodes[0].nodeValue;
            divText = "<h1>The contact details are:</h1><br /><table border=1><tr><th>First Name</th><th>Last Name</th><th>Phone</th><th>Street</th><th>City</th><th>State</th><th>Postcode</th></tr>" + "<tr><td>" + firstname + "</td><td>" + lastname + "</td><td>" + phone + "</td><td>" + street + "</td><td>" + city + "</td><td>" + state + "</td><td>" + postcode + "</td></tr>" + "</table>";
            break;
        }
        else
        {
            divText = "<h2>The contact does not exist.</h2>";
        }
    }
    alert(divText);
}