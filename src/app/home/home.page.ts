import { Component } from '@angular/core';
import { Globalization } from '@awesome-cordova-plugins/globalization/ngx';
import {GlobalProviderService} from '../services/global-provider.service';
import { HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import { Console } from 'console';
import { ToastController, NavController } from '@ionic/angular';
import { ClientRequest } from 'http';
import { runInThisContext } from 'vm';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  storage = this.global.storage;
  log = {};
  selectOptions:any;
  
  constructor(private globalization: Globalization, public global: GlobalProviderService, public http: HttpClient, public toastController: ToastController, private navCtrl : NavController) {
  }

  ngOnInit(){
    console.log('ionViewDidLoad');
    
    this.selectOptions = {
      cssClass: 'serverLocationModal',
      header: 'Select Server',
    };

    this.storage.set('login_status', false);
    this.storage.set('user','');
    this.storage.set('attendance_assignment', '');



    this.storage.get('url').then(data => {
      console.log("Storage Data:", data);
      if (!data) {
        this.globalization.getDatePattern({ formatLength: 'short', selector: 'date and time' }).then((name)=> {
          console.log('tz', name['timezone']);
          console.log('timezone', name['timezone']);
          if (name['timezone'] == "GMT+08:00") {
            this.log['server_location'] = "SG-2";   // TBC
          } else if (name['timezone'] == "GMT-05:00") {
            this.log['server_location'] = "Canada";
          } else {
            this.log['server_location'] = "SG-2";
          }
          console.log('server location', this.log['server_location']);
        });
      } else {
        this.global.server_url = data;
        console.log('url test', data);
        if (data == "https://www.simpple.app") {
          this.log['server_location'] = "SG-1";
        } else if (data == "https://ca.simpple.app") {
          this.log['server_location'] = "Canada";
        } else {
          this.log['server_location'] = "SG-2";
        }
      }
    });

    this.storage.keys().then(x => {
      console.log(x);
    });

  }

  login() {
    this.storage.set('url', this.global.server_url).then((url) => {
      if (this.log['server_location'] == "SG-1") {
        url = "https://www.simpple.app";
      } else if (this.log['server_location'] == "SG-2") {
        url = "https://sg.simpple.app";
      } else if (this.log['server_location'] == "Canada") {
        url = "https://ca.simpple.app";
      }
      this.storage.set('url', url).then((url) => {
        const httpOptions = {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': 'my-auth-token',
            'Access-Control-Allow-Origin': '*'
          })
        }
        
        this.http.post(url + '/api/attendance/getAttendanceAssignmentID', this.log, httpOptions).subscribe(data => {
          console.log(data);         
          if (data == false) {
            this.presentToast("Wrong Credentials", "warning", false);
          } else {
            this.storage.set('attendance_assignment', data);
            this.storage.set('login_status', true);
            // this.storage.set('attendance_assignment_id', data['attendance_assignment']['id']);
            this.presentToast("Login Successfully", "success", true);
          }
        });
      });
      
    });
  }

  async presentToast(msg, color, err) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 2000,
      color: color,
    });
    toast.present();
    const { role } = await toast.onDidDismiss(); 
    if (err) 
      this.navCtrl.navigateRoot('preview');
  }
}
