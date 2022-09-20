import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { GlobalProviderService } from '../services/global-provider.service';
import { TouchSequence } from 'selenium-webdriver';
import { ModalController, LoadingController } from '@ionic/angular';



@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss'],
})
export class LogsComponent implements OnInit {
  
  storage = this.global.storage;
  id:any;
  user
  userLoaded = false;
  allUsers: any;
  latestSelectedName: any;
  selectedName: any;
  filterModal: HTMLElement;
  backdrop: HTMLElement;




  constructor(private http : HttpClient, private global:GlobalProviderService, private loader:LoadingController) { }

  ngOnInit() {
    console.log('Creating log component');

    this.storage.get("attendance_assignment").then( (data) => {  
      this.id = data['attendance_assignment']['id']; 
    });


    this.getLogs();

  }

  async getLogs() {
    let loader = this.createLoader();
    (await loader).present();


    this.storage.get('url').then((url)=>{
      
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
        "attendance_id" : this.id
      };

      url = "http://192.168.0.154";
      this.http.post(url + '/api/attendance/getLogsV3', params, httpOptions).subscribe(async data => {
        console.log(data);
        

        let logCard = document.getElementById('logs-card');

        data['all_logs'].forEach((log) =>{
          let row = document.createElement('ion-row');
          row.setAttribute('class','logs-content');
          let colValue = Object.values(log);
          let colLength = colValue.length;

          for(let i =0; i<colLength; i++) {
            if(i==2) {
              let col = <HTMLElement>document.createElement('ion-col');
              col.setAttribute('class','logs-col');
              col.innerHTML = <string> colValue[0];
              row.append(col);
              break;
            }
            let col = <HTMLElement>document.createElement('ion-col');
            col.setAttribute('class','logs-col');
            col.innerHTML = <string> colValue[i+1];
            row.append(col);


          }
          logCard.append(row);

        });


        (await loader).dismiss();
      });

    });
  


  }


  async createLoader() {
    const loading = await this.loader.create();
    return loading;
  }

  segmentChanged(ev: any) {
    console.log('Segment changed', ev);
  }

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
    // this.content = document.getElementById('contentPage');
    // this.content.setAttribute('style','--overflow:hidden');
    // this.content.scrollToTop(0);

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



}
