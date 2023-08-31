import { Component } from '@angular/core';
import { Globalization } from '@awesome-cordova-plugins/globalization/ngx';
import {GlobalProviderService} from '../services/global-provider.service';
import { HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import { Console, error } from 'console';
import { ToastController, NavController, LoadingController } from '@ionic/angular';
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
  localUrl = 'http://192.168.100.143';

  constructor(private globalization: Globalization, public global: GlobalProviderService, public http: HttpClient, public toastController: ToastController, private navCtrl : NavController, private loader:LoadingController) {
  }


  /**
   * Initialise all necessary variables
   */
  async ngOnInit(){
    console.log('ionViewDidLoad');

    this.selectOptions = {
      cssClass: 'serverLocationModal',
      header: 'Select Server',
    };

    this.storage.set('user','');
    // this.storage.set('attendance_assignment', '');
    this.storage.set('isDeviceIos', this.isDeviceIos());
    this.storage.get('url').then(data => {
      if (!data) {
        console.log("No data");
        console.log(data);
        this.globalization.getDatePattern({ formatLength: 'short', selector: 'date and time' }).then((name)=> {
          console.log("TIMEZONE NAME = "+name['timezone']);
          if (name['timezone'] == "GMT+08:00") {
            this.log['server_location'] = "SG-2";   // TBC
          } else if (name['timezone'] == "GMT-05:00") {
            this.log['server_location'] = "Canada";
          } else if (name['timezone'] == "GMT+03:00") {
            this.log['server_location'] = "Qatar";
          } else {
            this.log['server_location'] = "Qatar";
          }
        });
      } else {
        console.log("Have data");
        console.log(data);
        this.global.server_url = data;
        if (data == "https://www.simpple.app") {
          this.log['server_location'] = "SG-1";
        } else if (data == "https://ca.simpple.app") {
          this.log['server_location'] = "Canada";
        } else if (data == "https://qr.simpple.app") {
          this.log['server_location'] = "Qatar";
        } else if (data == "https://stage.simpple.app") {
          this.log['server_location'] = "Stage";
        }
        else {
          this.log['server_location'] = "SG-2";
        }
      }
    });
    this.checkPrevLogin();
  }


  async checkPrevLogin() {
    let loader = await this.loader.create({
      spinner: 'crescent',
      cssClass: 'loader',
      message: 'Loading...',
    });
    await loader.present();

    console.log("Within check previous login");
    this.storage.get('attendance_assignment').then(async data=>{
      console.log("Attendance assignment data -> ");
      console.log(data);
      if(data) {
        let last_login;
        this.storage.get('last_login_date').then(x => {
          last_login = x;
          console.log(this.global.server_url);
          this.storage.set('url', this.global.server_url).then((url) => {
            console.log(url);
            console.log('server_location');
            if (this.log['server_location'] == "SG-1") {
              url = "https://www.simpple.app";
            } else if (this.log['server_location'] == "SG-2") {
              url = "https://sg.simpple.app";
            } else if (this.log['server_location'] == "Canada") {
              url = "https://ca.simpple.app";
            } else if (this.log['server_location'] == "Qatar") {
              url = "https://qr.simpple.app"
            } else if (this.log['server_location'] == "Stage") {
              url = "https://stage.simpple.app"
            }

            this.storage.set('url', url).then((url) => {
              const httpOptions = {
                headers: new HttpHeaders({
                  'Content-Type': 'application/json',
                  'Authorization': 'my-auth-token',
                  'Access-Control-Allow-Origin': '*'
                })
              }

              let params = {
                'assignment_id' : data['attendance_assignment']['id'],
                'last_login_date' : last_login
              }

              console.log(last_login);
              url = this.localUrl ==  undefined? url: this.localUrl;
              console.log('last url -'+url);
              this.http.post(url + '/api/attendance/verifyAttendanceAssignment', params, httpOptions).subscribe(async data => {
                await loader.dismiss();
                if (data == false) {
                  this.navCtrl.navigateRoot('preview');
                }
              } , async error => {
                console.log(error['status']);

                if(error['status'] != 200) {
                  await loader.dismiss();
                }
              });
            });
          });
        });
      }
      else{
        console.log("Loader should be dismissed here");
        await loader.dismiss();
      }
    });
  }

  async login() {

    let loader =  await this.loader.create({
      spinner: 'crescent',
      cssClass: 'loader',
      message: 'Loading...',
    });
    await loader.present();

    console.log("Login function");
    console.log("Global server url = "+this.global.server_url);
    this.storage.set('url', this.global.server_url).then((url) => {
      if (this.log['server_location'] == "SG-1") {
        url = "https://www.simpple.app";
      } else if (this.log['server_location'] == "SG-2") {
        url = "https://sg.simpple.app";
      } else if (this.log['server_location'] == "Canada") {
        url = "https://ca.simpple.app";
      } else if (this.log['server_location'] == "Qatar") {
        url = "https://qr.simpple.app"
      } else if (this.log['server_location'] == "Stage") {
        url = "https://stage.simpple.app"
      }

      this.storage.set('url', url).then((url) => {
        const httpOptions = {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': 'my-auth-token',
            'Access-Control-Allow-Origin': '*'
          })
        }

        console.log(url);
        url = this.localUrl ==  undefined? url: this.localUrl;
        console.log("URL being used to login - "+url);
        this.http.post(url + '/api/attendance/getAttendanceAssignmentID', this.log, httpOptions).subscribe(data => {
          if (data == false) {
            let alertIcon = '<ion-icon name="alert-circle-outline"></ion-icon>';
            this.presentToast(alertIcon + " Wrong Credentials", "danger", false);
            loader.dismiss();
          } else {
            let dateTime = new Date;
            this.storage.set('attendance_assignment', data);
            this.storage.set('last_login_date', dateTime.toLocaleString('en-US'));
            console.log('set date time ', dateTime.toLocaleString('en-US'));
            this.storage.set('login_status', true);
            let tickIcon = '<ion-icon name="checkmark-circle-outline"></ion-icon>';
            this.presentToast( tickIcon +" Login Successful", "success", true);
            loader.dismiss();
          }
        });
      });


    });
  }

  async presentToast(msg, color, err) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 1500,
      cssClass: 'home-toast',
      color: color,
      position: 'middle'
    });
    toast.present();
    await toast.onDidDismiss().then(()=>{
      if (err)
        this.navCtrl.navigateRoot('preview');
    });

  }


  /**
   * Checks if device is IOS
   *
   * @returns true or false
   */



  isDeviceIos() {
    return [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ].includes(navigator.platform)

    || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  }



}
