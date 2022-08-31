import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ModalController, LoadingController } from '@ionic/angular';
import { LabeledFaceDescriptors } from 'face-api.js';
import { GlobalProviderService } from '../services/global-provider.service';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.page.html',
  styleUrls: ['./logs.page.scss'],
})
export class LogsPage implements OnInit {
  logs_array;
  location_code;
  overtime_limit;
  cleaner_int;
  supervisor_int;
  cleaner_shifts; 
  supervisor_shifts;
  supervisors;
  cleaners;
  show_details = false;
  storage = this.global.storage;
  id: any;
  filterModal:any;
  backdrop:any;
  selectedName = 'All'; 
  latestSelectedName:any;
  selectedModal: HTMLElement;
  selectedNameForBackBtn: string;
  selectedId: any;
  selectedIdForBackBtn: any;
  allUsers = [];
  initialSelectedName:any;
  content:any;
  userLoaded:boolean = false;



  constructor(private modal: ModalController, private global: GlobalProviderService, private http: HttpClient,private loadingCtrl: LoadingController) { }

  async ngOnInit() {
    this.storage.get("attendance_assignment").then((data) => {
      this.id = data['attendance_assignment']['id'];
    });
    console.log('initialising log page');
    this.getHistory(false);
    this.storage.get('user').then((name) => {this.initialSelectedName = name;});
    // this.getAllUsers();


  }


  async ionViewDidEnter() {
    console.log('entering log page');


    // Set the correct button size if device is IOS
    this.storage.get('isDeviceIos').then(async x => {
      if (x){
        let btn = document.getElementById('filterBackBtn');
        btn.style.width = '20px';
        console.log(btn.style.width);
        await new Promise<void>((resolve)=>{
          setTimeout(() => {
            console.log('entered here');
            resolve();
          }, 300);
        });
        btn.style.width = '43px';
        console.log(btn.style.width);
      }
    });
  }

  async getAllUsers() {
    if (this.userLoaded)
      return;
    let loader = this.createLoader();
    (await loader).present();

    this.storage.get('url').then((url) => {
      console.log(url);
      const httpOptions = {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          'Authorization': 'my-auth-token',
          'Accept': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Origin': '*'
        })
      };

      const params = {
        "attendance_id" : this.id,
      };
      url = "http://192.168.0.154"; 
      this.http.post(url + '/api/attendance/getAttendanceAssignmentUsers', params, httpOptions).subscribe(async data => {
        this.allUsers = data['users'];
        this.userLoaded = true;
        (await loader).dismiss();

      });
    });
  }

  /**
   * Gets Attendance Log and check if there is filter
   * 
   * @param filter : true or false
   */

  async getHistory(filter) {
    let loader = this.createLoader();
    (await loader).present();

    this.storage.get('url').then(async (url) => {
      console.log(url);
      const httpOptions = {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          'Authorization': 'my-auth-token',
          'Accept': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Origin': '*'
        })
      };
      let params = {
        "attendance_id" : this.id,
      };

      if(filter) {
        params['user'] = this.selectedId;
        let logDiv = document.getElementById('logCardDiv');
        logDiv.innerHTML ='';
      }
      else {
        if(params['user'] != null) {
          delete params['user'];
        }
      }

      url = "http://192.168.0.154"; 
      this.http.post(url + '/api/attendance/getLogsV2', params, httpOptions).subscribe(async data => {
        
        data['logs'] = data['logs'].reverse();

        // Creates log card and insert into HTML
        let logDiv = document.getElementById('logCardDiv');

        if (data['logs'] != null) {
          data['logs'].forEach(x => {
            var options = { year: "numeric", month: 'long', day: 'numeric' };
            let name = x['user']['name'];
            let clockInTime = this.setDate(x['clock_in']);
            let shiftClockInTime = this.setDate(x['shift_in_time']);
            let shiftClockOutTime = this.setDate(x['shift_out_time']);


            let clockOutTime, punctuality, overTime,hoursWorked,clockOut;
            let clockIn= this.getDateString(clockInTime);
            let shiftClockIn = this.getDateString(shiftClockInTime);
            let shiftClockOut = this.getDateString(shiftClockOutTime);


            const diff = shiftClockOutTime.getTime() - shiftClockInTime.getTime();
            let shiftDuration = Math.floor(diff / 1000 / 60 / 60);

            if (clockInTime > shiftClockInTime) {
              punctuality = '<span style="color:red; font-weight:bold;">Late</span>';
            }
            else {
              punctuality  = 'On Time';
            }


            if (x['clock_out'] != null) {
              clockOutTime = new Date(x['clock_out'].replaceAll('-', '/'));
              clockOut = this.getDateString(clockOutTime);

              
              const hrs = clockOutTime.getTime() - clockInTime.getTime();
              hoursWorked = Math.floor(hrs / 1000 / 60 / 60);

              if(hoursWorked > shiftDuration) {
                overTime = hoursWorked - shiftDuration;
              }
              else {
                overTime = 0;
              }
            }
            else {
              clockOut = '-';
              hoursWorked = '-';
              overTime = '-';
            }

            logDiv.innerHTML +=
            `
              <ion-card class ='logCard'>
              <div class='logCardContainer'>
                <div class="logCardHeader">
                  ${name}
                </div>
                <ion-row class="logCardItem">
                  <div>
                    <p class="itemHeader">Clocked In</p>
                    <p class="clockInTime">${clockIn}</p>
                  </div>
                  <div>
                    <p class="itemHeader">Shift Clock In</p>
                    <p class="itemText">${shiftClockIn}</p>
                  </div>
                </ion-row>
        
                <ion-row class="logCardItem">
                  <div>
                    <p class="itemHeader">Clocked Out</p>
                    <p class="clockOutTime">${clockOut}</p>
                  </div>
                  <div>
                    <p class="itemHeader">Shift Clock Out</p>
                    <p class="itemText">${shiftClockOut}</p>
                  </div>
                </ion-row>
        
                <ion-row class="logCardItem">
                  <div>
                    <p class="itemHeader">Work Summary</p>
                    <p class="itemText">Punctuality: ${punctuality}</p>
                    <p class="itemText">Shift Duration: ${shiftDuration}</p>
                    <p class="itemText">Total Overtime Hours: ${overTime}</p>
                    <p class="itemText">Hours Worked: ${hoursWorked}</p>
                    
                  </div>
                </ion-row>
              </div>
            </ion-card>
            `;

          });
        }

        (await loader).dismiss();
      });

    });
  }

  setDate(dateString) {
    let temp = dateString.replaceAll('-', '/');
    let date = new Date(temp);
    return date;
  }

  getDateString(dateTime) {
    let tempDate = dateTime;
    const options: Intl.DateTimeFormatOptions = {  day: 'numeric', month: "long", year:'numeric'};
    let temp = new Intl.DateTimeFormat('en-US', options).format(tempDate);
    let year = temp.split(',')[1];
    let day = temp.replace(' ', ',').split(',');
    let date = day[1] + ' ' + day[0];
    let string = date + year + ' | ' + ("0" + dateTime.getHours()).slice(-2) + ":" + ("0" + dateTime.getMinutes()).slice(-2);
    return string;
  }


  toggleDetails() {
    this.show_details = !this.show_details;
  }


  selectedValue(name,id) {
    this.selectedName = name;
    this.selectedId = id;
    this.hideSelectedModal('selectUser',false);
  }




 /**
  * Filter Components 
  */

  showFilterModal(type) {
    console.log('showing filter model');
    this.getAllUsers();
    this.latestSelectedName = this.selectedName;
    
    this.filterModal = <HTMLElement>document.getElementsByClassName('filterModal')[0];
    this.backdrop = <HTMLElement>document.getElementsByClassName('backdrop')[0];
    this.filterModal.style.display = 'block';
    this.filterModal.style.animation = 'filter_slide_in .2s linear';
    this.filterModal.style.animationFillMode = 'forwards';
    this.filterModal.style.zIndex = '1000';
    this.backdrop.style.display = 'block';
    this.backdrop.style.zIndex = '100';
    this.content = document.getElementById('contentPage');
    this.content.setAttribute('style','--overflow:hidden');
    this.content.scrollToTop(0);

  }

  hideFilterModal(buttonTriggered) {
    console.log("Hiding filter modal")
    //If filter values werent applied then get the latest applied filters
    if(buttonTriggered){
      this.selectedName = this.latestSelectedName;
    }
    this.filterModal = <HTMLElement>document.getElementsByClassName('filterModal')[0];
    this.backdrop = <HTMLElement>document.getElementsByClassName('backdrop')[0];
    this.filterModal.style.animation = 'filter_slide_out .2s linear';
    this.filterModal.style.animationFillMode = 'forwards';
    this.backdrop.style.display = 'none';
    this.content = document.getElementById('contentPage');
    this.content.setAttribute('style','--overflow:auto');
  }

  showSelectedModal(){
      // this.latestSelectedName = this.selectedName;
      // this.latestSelectedId = this.selectedId;
      // this.selectedNameForBackBtn = this.selectedName;
      // this.selectedIdForBackBtn = this.selectedId;
      this.selectedModal = <HTMLElement>document.getElementsByClassName('selectedUserFilterModal')[0];
      this.selectedNameForBackBtn = this.selectedName;
      this.selectedName = '';
      this.selectedModal.style.display = 'block';
      this.selectedModal.style.animation = 'slide_left .2s linear';
      this.selectedModal.style.animationFillMode = 'forwards';
      this.selectedModal.style.zIndex = '1003';
  }


  hideSelectedModal(type,buttonTriggered) {
    console.log("Button triggered = ",buttonTriggered);
    if (type == 'selectUser') {
      if(buttonTriggered){
        console.log("Back button is pressed");
        this.selectedName = this.selectedNameForBackBtn;
      }
      this.selectedModal = <HTMLElement>document.getElementsByClassName('selectedUserFilterModal')[0];
      this.selectedModal.style.animation = 'slide_left_out .2s linear';
      this.selectedModal.style.animationFillMode = 'forwards';
      this.content = document.getElementById('contentPage');
      this.content.setAttribute('style','--overflow:hidden');
    }
    console.log("Done hiding modal");
  }

  clearSearch() {
    this.selectedName = 'All';
  }

  applyFilter() {
    if(this.selectedName == 'All') {
      this.getHistory(false);
    }
    else{
      this.getHistory(true);
    }
    this.hideFilterModal(false);
  }

  async createLoader() {
    const loading = await this.loadingCtrl.create();
    return loading;
  }

}