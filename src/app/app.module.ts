import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { Device } from '@awesome-cordova-plugins/device/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { environment } from 'src/environments/environment';

//IMPORT OFFICIAL ANGULAR FIRE AND THE ENVIRONMENT TO LOAD FIREBASE.
import { AngularFireModule } from '@angular/fire/compat';

//IMPORT FIRESTORE (DB) MODULE TO PERFORM A QUERY
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule ,AngularFireModule.initializeApp(environment.firebase),  AngularFirestoreModule],
  providers: [Device, { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {}
