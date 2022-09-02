import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { async } from '@angular/core/testing';
import { BooleanValueAccessor } from '@ionic/angular';
import { TouchSequence } from 'selenium-webdriver';
import { GlobalProviderService } from 'src/app/services/global-provider.service';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss'],
})
export class DetailsComponent implements OnInit {
  attendance_assignment: any;
  show_details = false;
  user_logged_in: boolean = false;
  location_code;
  overtime_limit;
  cleaner_int;
  supervisor_int;
  cleaner_shifts; 
  supervisor_shifts;
  supervisors = '';
  cleaners = '';
  supvArr = [];
  cleanerArr = [];
  storage = this.global.storage;
  id: any;
  login_prompt = "To start your shift, please enter the location access codes, via the top right navigation bar.";
  allUsers: any;

  constructor(private global: GlobalProviderService, private http: HttpClient) { }

  ngOnInit() {
    console.log('Initialising details');
    this.getLoggedIn();
    this.getDetails();
  }


  getLoggedIn() {
    this.storage.get('login_status').then( data => { 
      console.log('data', data);
      this.user_logged_in = data;
    });
    this.storage.get("attendance_assignment").then((data) => {
      console.log(data); 
      this.id = data['attendance_assignment']['id'];
    });
  }

  async getDetails() {
    await this.getAllUsers();
    this.storage.get("attendance_assignment").then((data) => {
      console.log(data);
      this.location_code = data['attendance_assignment']['location_code'];
      this.overtime_limit = data['attendance_assignment']['overtime_limit'];
      this.cleaner_int = data['attendance_assignment']['scan_interval_user'];
      this.supervisor_int = data['attendance_assignment']['scan_intervasl_supervisor'];
      this.cleaner_shifts = data['attendance_assignment']['shift_hours'];
      this.supervisor_shifts = data['attendance_assignment']['shift_hours_supervisor'];
    });
  }

  getAllUsers() {
    return new Promise<void>((resolve)=> {
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
          // data['users'].forEach(x => {
          //   this.allUsers.push(x['name']);
          // });
          this.allUsers = data['users'];
          console.log(this.allUsers);

          this.allUsers.forEach(x=> {
            if(x['role_id'] == 2) {
              this.cleanerArr.push(x['name']);
            }
            else {
              this.supvArr.push(x['name']);
            }
          });
          
          await new Promise<void>((r)=>{
            setTimeout(() => {
              r();
            }, 200);
          });


     
          for(let i = 0; i < this.cleanerArr.length;i++) {
            this.cleaners += `${i+1}. ${this.cleanerArr[i]}
            `;
          }
          for(let i = 0; i < this.supvArr.length;i++) {
            this.supervisors += `${i+1}. ${this.supvArr[i]}
            `;
          }
          console.log(this.cleaners);
          console.log(this.supervisors);
          resolve();
        });
      });
    });
  }

  toggleDetails() {
    this.show_details = !this.show_details;
    let textEle = document.getElementsByClassName('overlayText');
    if(textEle.length > 0){
      if (this.show_details) {
        let text = <HTMLElement> textEle[0];
        text.style.display = 'none';
      }
      else {
        let text = <HTMLElement> textEle[0];
        text.style.display = 'block';
      }

    }
  }
}
