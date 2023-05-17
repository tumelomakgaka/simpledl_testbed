import { Component } from '@angular/core';
import { doSearch } from '../../assets/simple_dl';
import { HttpClient,HttpHeaders  } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { File } from '@awesome-cordova-plugins/file/ngx';
//Import AngularFirestore to make Queries.
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Device } from '@awesome-cordova-plugins/device/ngx';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})


export class HomePage {

    // persistent result storage for paging
  public filenames = new Array ();
  public ranked = new Array ();
  public prefix = '';
  public query;
  public searchQueries = [];
  public searchQueries2 = [];
  public totalIndex1Time = 0;
  public totalIndex2Time = 0;
  public totalIndex3Time = 0;

  public collectionDirectory;

  public timeBegan = null;
  public timeStopped:any = null;
  public stoppedDuration:any = 0;
  public started = null;
  public deviceID = '';
  public running = false;
  public blankTime = "00:00.000";
  public time = "00:00.000";
  public search1Done = false;

  constructor(public http : HttpClient,private file: File,private firestore: AngularFirestore, private device: Device) {
      this.collectionDirectory = this.file.documentsDirectory+'/NoCloud/simple_dl/simple_dl';
  }

  async searchIndex1(){
   var k = 0;
   while(k<this.searchQueries[0]['value'].length){
      var searchTime = await this.doSearch(this.searchQueries[0]['value'][k].query,'1');
      this.searchQueries[0]['value'][k].time = searchTime;
      this.searchQueries[0]['totalIndexTime'] = this.searchQueries[0]['totalIndexTime'] + this.searchQueries[0]['value'][k].time; 
      k = k+1;
    }
  }

  async searchIndex2(){
   var l = 0;
   while(l<this.searchQueries[1]['value'].length){
      var searchTime = await this.doSearch(this.searchQueries[1]['value'][l].query,'2');
      this.searchQueries[1]['value'][l].time = searchTime;
      this.searchQueries[1]['totalIndexTime'] = this.searchQueries[1]['totalIndexTime'] + this.searchQueries[1]['value'][l].time; 
      l = l+1;
    }
  }

  async searchIndex3(){
   var m = 0;
   while(m<this.searchQueries[2]['value'].length){
      var searchTime = await this.doSearch(this.searchQueries[2]['value'][m].query,'3');
      this.searchQueries[2]['value'][m].time = searchTime;
      this.searchQueries[2]['totalIndexTime'] = this.searchQueries[2]['totalIndexTime'] + this.searchQueries[2]['value'][m].time; 
      m = m+1;
    } 
  }

  async start() {  
   this.running = true;
   await this.searchIndex1();
   await this.searchIndex2();
   await this.searchIndex3();
   this.started = true;
   this.firestore.collection("testbedResults").add({
      deviceID:this.device.uuid,
      deviceModel:this.device.model,
      platform:this.device.platform,
      isVirtual:this.device.isVirtual,
      serialNum:this.device.serial,
      index1:this.searchQueries[0].totalIndexTime,
      index2:this.searchQueries[1].totalIndexTime,
      index3:this.searchQueries[2].totalIndexTime
   });
  }

    zeroPrefix(num, digit) {
      let zero = '';
      for(let i = 0; i < digit; i++) {
        zero += '0';
      }
      return (zero + num).slice(-digit);
  }

    clockRunning(){
      let currentTime:any = new Date()
      let timeElapsed:any = new Date(currentTime - this.timeBegan - this.stoppedDuration)
      let hour = timeElapsed.getUTCHours()
      let min = timeElapsed.getUTCMinutes()
      let sec = timeElapsed.getUTCSeconds()
      let ms = timeElapsed.getUTCMilliseconds();
    this.time =
      this.zeroPrefix(hour, 2) + ":" +
      this.zeroPrefix(min, 2) + ":" +
      this.zeroPrefix(sec, 2) + "." +
      this.zeroPrefix(ms, 3);
  };


  async loadXML(URL): Promise <XMLDocument > {
   return new Promise((resolve, reject) => {
     const xhttp = new XMLHttpRequest();
     try {       
       xhttp.onloadend = function () {
         resolve(xhttp.responseXML);
       };
       xhttp.open("GET", URL, true);
       xhttp.send();
     } catch (error) {
      console.log(error);
       reject(error);
       // Do something with error
     }
   });
 }

ionViewWillEnter(){
  this.loadSearchQueries();
}

async loadSearchQueries(){
  fetch('../../assets/simple_dl/indexes/searchQueries.json').then(async res => {
    this.searchQueries = await res.json();
  });
//   fetch('../../assets/simple_dl/searchQueries.json').then(async res => {
//    this.searchQueries2 = await res.json();
//  });
}

// main search function
async doSearch(query,index_number)
{   
   var startTime = Date.now();
   var terms;
   var prefix;
   var index;
   var accum;
   var filenames;
   var filetitles;
//Note: this variable did not previously exist here   
   var toplevel = 'main'
   // prefix for http requests
   if (toplevel == 'main')
      prefix = 'metadata/';
   else if (toplevel == 'users')
      prefix = 'users/';

   // split query into terms and split out spaces
   query = query.toLowerCase ();
   query = query.replace (/['"_\.]/g, " ");
   query = query.replace (/^ +/, "");
   query = query.replace (/ +$/, "");
  query = query.replace (/%20/, " ");
//    // which index to use
   var use_index = 1;
   if (! use_index)
      use_index = 1; 

   // turn extended unicode characters into simple numbers
   var i;
   var j = query.length;
   var newquery = '';
   for ( i=j-1; i>=0; i-- )
   {
      var achar = query.charAt (i);
      if (achar.match(/[a-zA-Z0-9\: ]/))
      {
         newquery = achar+newquery;
      }
      else
      {
         newquery = '_'+query.charCodeAt (i)+'_'+newquery;
      }
   }
   // create array
   accum = new Array();
//   filenames = new Array();
   filenames = new Array ();
   filetitles = new Array();

   //Note: replace page number in line 280
   var pageNum = 1;
   // make sure we do not split an empty query   
   if (newquery == '')
      terms = new Array;
   else
      terms = newquery.split (/ +/);
   // read term frequency files
   for ( let i=0; i<terms.length; i++ )
   {
      var use_field = 'all';
      
      if (terms[i].match (/\:/))
      {
         var parts = terms[i].split (/\:/);
         if ((parts.length < 2) || (parts[0] == '') || (parts[1] == ''))
            continue;
         use_field = parts[0];
         terms[i] = parts[1];
      }
      index = await this.loadXML ("../../assets/indexes/reducedIndices/search"+index_number+"/"+terms[i]+".xml");
      if (index == null)
         continue;

      var wordlist = index.getElementsByTagName('tf');
      var df = wordlist.length;
      for ( let j=0; j<wordlist.length; j++ )
      {
         var value = wordlist.item(j).firstChild.data;
         var fileid = wordlist.item(j).getAttribute ('id');
         filenames[fileid] = wordlist.item(j).getAttribute ('file');
         filetitles[fileid] = wordlist.item(j).getAttribute ('title');
         if (isNaN (accum[fileid]))
            accum[fileid] = 0;
         accum[fileid] += parseFloat(value) / df;
      }
   }
   // selection sort based on weights, ignoring zero values
//   var ranked = new Array();
   this.ranked = new Array ();
   var weight = new Array();
   var k = 0;
   for ( let i=0; i<accum.length; i++ )
   {
      if (! isNaN (accum[i]))
      {
         this.ranked[k] = i;
         weight[k] = accum[i];
         k++;
      }
   }
   for ( let i=0; i<this.ranked.length; i++ )
   {
      var max = i;
      for ( let j=i+1; j<this.ranked.length; j++ )
         if (weight[j] > weight[max])
            max = j;
      if (max != i)
      {
         var swap = weight[i];
         weight[i] = weight[max];
         weight[max] = swap;
         swap = this.ranked[i];
         this.ranked[i] = this.ranked[max];
         this.ranked[max] = swap;
      }
   }
   // check for empty query and add full list of items
   if (query == '')
   {
      index = await this.loadXML ("../../assets/indexes/newIndexes/"+index_number+"/fulllist/index.xml");
      if (index)
      {
         var wordlist = index.getElementsByTagName ('tf');
         //var df = wordlist.length;
         for ( let j=0; j<wordlist.length; j++ )
         {
            var fileid = wordlist.item(j).getAttribute ('id');
            filenames[fileid] = wordlist.item(j).getAttribute ('file');
            filetitles[fileid] = wordlist.item(j).getAttribute ('title');
            this.ranked[j]=j;
            accum[fileid] = 1;
         }         
      }
   }
   // do browse and sort processing
   var config = await this.loadXML ("../../assets/indexes/config/config.xml");
   if (config)
   {
      // search for a matching index in the config file
      var toplevelconfig = null;
      var configs = config.getElementsByTagName ('toplevel');
      for ( let j=0; j<configs.length; j++ )
      {
         if (configs.item(j).getAttribute ('id') == toplevel)
            toplevelconfig = configs.item(j);
      }      
      if (toplevelconfig)
      {
         // check for browse filters and remove those results
         var bfields = toplevelconfig.getElementsByTagName ('field_browse').item(0).getElementsByTagName ('field');
         for ( let j=0; j<bfields.length; j++ )
         {
            // var field_name = bfields.item(j).getElementsByTagName ('id').item(0).firstChild.data;
            // var field_value = document.forms["searchform"].elements["field_browse_"+field_name].value;
            var field_name = '';
            var field_value='all';
            if (field_value != "all")
            {
               var browse_index = await this.loadXML ("../../assets/indexes/browse/1/"+field_name+"/"+field_value+".xml");
               if (browse_index)
               {
                  var ids = new Array ();
                  var bif = browse_index.getElementsByTagName ('bif');
                  for ( let k=0; k<bif.length; k++ )
                  {
                     ids[bif.item(k).getAttribute ('id')]=1;
                  }
                  var new_ranked = new Array ();
                  accum = new Array ();
                  var l=0;
                  for ( let k=0; k<this.ranked.length; k++ )
                     if (ids[this.ranked[k]] == 1)
                     {
                        new_ranked[l] = this.ranked[k];
                        accum[this.ranked[k]] = 1;
                        l++;
                     }
                  this.ranked = new_ranked;
               }
            }
         }
         // check for sort filters and apply
         var sort_value = 'title';
         if (sort_value != 'relevance')
         {
            var sort_index = await this.loadXML ("../../assets/indexes/sort/"+sort_value+"/index.xml");
            if (sort_index)
            {
               var new_ranked = new Array ();
               var sif = sort_index.getElementsByTagName ('sif');
               for ( let j=0; j<sif.length; j++ )
               {
                  var fileid;
                  fileid = sif.item(j).getAttribute ('id');
                  if ((! isNaN (accum[fileid])) && (accum[fileid] > 0))
                  {
                     new_ranked.push (fileid);
                  }
               }
               this.ranked = new_ranked;
            }
         }
      }
   }
  var searchResults = this.ranked;
   pageNum = 1;
  var endTime = Date.now();
  var totalTime = endTime - startTime;
  
   return totalTime;
}


}
