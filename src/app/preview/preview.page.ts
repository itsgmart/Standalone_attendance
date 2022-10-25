import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Plugins } from "@capacitor/core"
const { CameraPreview } = Plugins;
import { CameraPreviewOptions, CameraPreviewPictureOptions, CameraSampleOptions } from '@capacitor-community/camera-preview';
import '@capacitor-community/camera-preview';
import { ModalController, NavController, ToastController, LoadingController } from '@ionic/angular';
import * as faceapi from 'face-api.js';
// import { File } from '@awesome-cordova-plugins/file/ngx';
// import { TouchSequence } from 'selenium-webdriver';
import { GlobalProviderService } from '../services/global-provider.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ClockinoutPage } from '../clockinout/clockinout.page';

import { Executor } from 'selenium-webdriver';
import { SupvOptionComponent } from '../supv-option/supv-option.component';
import { resolve } from 'dns';
import { ChildActivationStart } from '@angular/router';
import { Router } from '@angular/router';
import { threadId } from 'worker_threads';



@Component({
  selector: 'app-preview',
  templateUrl: './preview.page.html',
  styleUrls: ['./preview.page.scss'],
})

export class PreviewPage implements OnInit {
  image = null;
  capturedImage= new Image();
  cameraActive = false;
  displaySize: { width: number; height: number; };
  detection: faceapi.FaceDetection;
  resizedDetections: faceapi.FaceDetection;
  count = 3;
  maxCount = 3;
  myInterval: NodeJS.Timeout;
  width: number;
  height: number;
  faceWarning = 'Move closer';
  warningShown = false;
  toofastShown = false;
  tooFast = false;
  storage = this.global.storage;
  rawImage: string;
  id: any;
  rawImageCheck ='';
  header: any;
  message: any;
  modal: HTMLElement;
  faceDetected: boolean = false;


  url: any;
  show_details = false;
  isSupervisor = false;
  taptap = 9 ;

  user:any;
  shift_in:any;
  shift_out:any;
  user_type:any;
  dateTime:any;
  type: string;
  isLogsOpen = false;
  isDetailsOpen = false;

  modalAttendance:HTMLIonModalElement;
  toast:HTMLIonToastElement;
  isToastOpen = false;

  logCached = {
    All: [],
    Clock_In: [],
    Clock_Out: []
  }
  userLoaded = false;
  allUsers: any;
  latestSelectedName: any;
  selectedName = "All";
  filterModal: HTMLElement;
  backdrop: HTMLElement;
  content:any;

  assignment:any;
  shift_hours_split:any;
  shift_hours_supervisor_split:any;
  selectedModal: HTMLElement;
  selectedNameForBackBtn: string;
  initialSelectedName: string;
  selectedId: any;

  clkinOffset = 0;
  clkoutOffset = 0;
  firstLoad = true;

  enable_attendance_log:any;
  facecheckLoader:any;
 
  warningHeader:any;
  warningMsg:any;
  toofastHeader:any;
  toofastMsg:any;
  userNotFound: boolean;
  localUrl = "http://192.168.0.155";
  isBlackOut = false;
  supvOptmodal: HTMLIonModalElement;
  blackScreenLoader: any;


  constructor(private global: GlobalProviderService, private http : HttpClient, public toastController: ToastController, private modalCtrl:ModalController, private router: Router, private navCtrl: NavController, private loader:LoadingController) {}

  ngOnInit() {
    console.log('initialising preview page');
    // faceapi.nets.tinyFaceDetector.load('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
    console.log('loaded face model ', faceapi.nets.tinyFaceDetector.isLoaded);
  }

  async ionViewDidEnter() {
    console.log('entering preview page');

    // await new Promise<void>((resolve)=>{
    //   setTimeout(()=>{
    //     resolve();
    //   },100);
    // });
    
    this.launchCamera();
    this.content = document.getElementById('contentPage');
    this.storage.get('attendance_assignment').then((data)=>{
      console.log("--debug");
      console.log(data['attendance_assignment']);
      this.assignment = data['attendance_assignment'];
      this.enable_attendance_log = this.assignment.enable_attendance_log;
      this.shift_hours_split = this.assignment.shift_hours.split("|");
      this.shift_hours_supervisor_split = this.assignment.shift_hours_supervisor.split("|");
      
    });
  }


  tap9times() 
  { 
    this.taptap = this.taptap - 1;

    if (this.taptap > 0)
    {
      setTimeout(()=>{
        this.taptap = 9;
        console.log(this.taptap);
        return;
      }, 60000);
      console.log(this.taptap);
    }


      if (this.taptap == 0)
      {
        this.taptap = 9;
        let text = "Press a button!\nEither OK or Cancel.";
        if (confirm(text) == true)
          {
            this.storage.clear();
            this.router.navigateByUrl('/home')
            console.log(this.taptap);
          }
      }
  }

  ionViewDidLeave() {
    console.log('closing camera');
    CameraPreview.stop();
    clearInterval(this.myInterval);
  }

  toggleDetails() {
    this.show_details = !this.show_details;
  }

  async launchCamera() {
    this.width = window.screen.width;
    this.height = window.screen.height;

    const cameraPreviewOptions: CameraPreviewOptions = {
      position: 'front', // front or rear
      parent: 'content', // the id on the ion-content  , web only
      width: this.width, //width of the camera display
      height: this.height - 56, //height of the camera
      y: 56,
      toBack: true,
    };


    await CameraPreview.start(cameraPreviewOptions);
    if(this.image != null) {
      this.image = null;
    }
    this.cameraActive = true;
    this.startDetection();
  }

  async startDetection() { 
    console.log("start detection");

    if(!this.blackScreenLoader) {
      var loader = await this.loader.create({
        spinner: 'crescent',
        cssClass: 'loader',
        message: 'Initializing Camera',
      });
      (await loader).present();
      this.storage.get("attendance_assignment").then( (data) => {  
        this.id = data['attendance_assignment']['id'];    
        console.log("id inside",this.id); 
      });
    } else {
      this.blackScreenLoader.dismiss();
      this.blackScreenLoader = null;
    }


    const cameraSampleOptions: CameraSampleOptions = {
      quality: 50
    };

    this.displaySize = {
        width: this.width,
        height: this.height,
    };

    // Takes picture every 1s
    this.myInterval = setInterval(async ()=>{
      let res = await CameraPreview.captureSample(cameraSampleOptions);
      this.capturedImage.src = `data:image/jpeg;base64,${res.value}`; 
      this.rawImage = res.value;
      this.capturedImage.width = this.width;
      this.capturedImage.height = this.height;
     
      this.detection = await faceapi.detectSingleFace(this.capturedImage,  new  faceapi.TinyFaceDetectorOptions({scoreThreshold: 0.5}));
      if(loader) {
        (await loader).dismiss();
        loader = null;
      }
      console.log(this.detection);

      this.processImage();
    
    }, 1000);


  }

  async processImage() {

    // this.showInfoDisplay();
    if (this.detection == undefined) {
      if(this.modalAttendance != undefined) {
        if(this.modalAttendance.isOpen) {
          // comment both below to edit modalattendance
          this.modalAttendance.dismiss();
          this.modalAttendance.isOpen = false;
        }
      }

      if(this.warningShown)
        this.warningShown = false;

      this.count = this.maxCount; 
      console.log("Count1:",this.count);
      this.faceDetected = true;
      //this.warningShown = false;
    } 
    else {  // Faace is detected
      let detect_width = this.detection.box.width;
      let detect_height = this.detection.box.height;

      // check if faace is big enough, else show msg
      if (this.isBigEnough(detect_width, detect_height))  {   
        console.log('face is big enough');
        this.faceDetected = true;  //face detected 
        this.warningShown = false; //hide move closer warning
        this.count -= 1; 
      }
      else {
        // Move Closer 
        console.log('face too far away');      
        //this.hideInfoDisplay();
        this.warningShown = true;
        this.tooFast = false;
        this.warningHeader = 'Move Closer';
        this.warningMsg = 'Please move closer to the camera'
        this.count = this.maxCount;
        // this.timeout(2000); //warning stay for  2 seconds
        // this.warningShown = false;
      }
      // if count reach 0, take picture and check face, and stop detection
      console.log("Count2:",this.count); 
      if (this.count == 0) {  
        console.log("Take picture"); 
        this.faceDetected = false;
        this.count = this.maxCount;
        this.rawImageCheck = this.rawImage;


        if(this.facecheckLoader == null && this.modalAttendance == null 
          && this.isToastOpen == false && this.supvOptmodal==null && this.tooFast == false) 
        {
          console.log('checking face');
          this.facecheckLoader = await this.loader.create({
            spinner: 'crescent',
            cssClass: 'loader',
            message: 'Loading Please Wait'
          });
          await this.facecheckLoader.present();
          this.checkFace();
        }

      } 

      this.resizedDetections = faceapi.resizeResults(
          this.detection, 
          this.displaySize
      );
    }  
  }

  hideInfoDisplay(){
    let textEle = document.getElementsByClassName('overlayText');
    if(textEle.length > 0){
      let text = <HTMLElement> textEle[0];
      text.style.display = 'none';    
    }
  }

  showInfoDisplay(){
    let detailsCard = document.getElementById('detailsCard');
    if (detailsCard != null) {
      this.hideInfoDisplay();
      return;
    }
    let textEle = document.getElementsByClassName('overlayText');
    if(textEle.length > 0){
      let text = <HTMLElement> textEle[0];
      text.style.display = 'block';    
    }
  }

  isBigEnough(detect_width,detect_height):boolean {
    if (detect_width >= (1/4)*this.width && detect_height >= (1/4)*this.height) { // Decrease to make box smaller
      return true;
    }
    else {
      return false;
    }
  }

  async checkFace() {

    
    this.storage.set('url', this.global.server_url).then((url) => {
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
        "image" : this.rawImageCheck,
        "location_id" : this.id,
        'Harron_Version' : true
      };
      console.log("params:", params);
      console.log(url);
      url = this.localUrl;
      this.http.post(url + '/api/attendance/checkAttendance', params, httpOptions).subscribe(async data => {
        console.log(data);
        
        // check if face is in aws face collection
        if(data) {

          // if unable to clock in/out, show msg on toast
          // else get data to display on attendanceModal
          if(data['status'] != null) {
            if (this.facecheckLoader != null) {
              await this.facecheckLoader.dismiss();
              this.facecheckLoader = null;
            } 
            let status = data['status'];
            let scanwait = data['time_diff'];
            switch(status) 
            {
              case 'Too fast':
                  this.tooFast = true;
                  this.warningShown = false;
                  this.toofastHeader = 'Scan Error';
                  this.toofastMsg = `Scanning allowed after ${scanwait} seconds. Please try again later` ;
                  this.timeout(3000).then(()=>{
                    this.tooFast = false;
                  });
                  console.log(scanwait);
                break;

              case 'not assigned to location':
                  this.warningShown = true;
                  this.warningHeader = 'User not assigned to location';
                  this.warningMsg = 'Please ensure that you are scanning the correct location';
                break;    
            }
          } else{
            console.log('testt', data['isSupv']);
            //Check if user is a supervisor, then give supervisor the option to use to clock in as supv or user
            if(data['isSupv']) {
              console.log('creating modal for Supervisor Option');
              this.supvOptmodal = await this.modalCtrl.create({
                component: SupvOptionComponent,
                cssClass: 'supvOptionModal',
                showBackdrop: true,
                backdropDismiss: false
              });
              if (this.facecheckLoader != null) {
                await this.facecheckLoader.dismiss();
                this.facecheckLoader = null;
              } 
              await this.supvOptmodal.present();
              console.log('modal presented');
              await this.supvOptmodal.onDidDismiss().then(async x=>{
                let loader = this.loader.create({
                  spinner: 'crescent',
                  cssClass: 'loader',
                  message: 'Clocking In',
                });
                (await loader).present();
                this.supvOptmodal = null;
                if (x['data']['role'] != undefined) 
                {
                  let user_type = x['data']['role'];

                  let params = {
                    "image" : this.rawImageCheck,
                    "location_id" : this.id,
                    'Harron_Version' : true,
                    'user_type' : user_type
                  }

                  this.http.post(url + '/api/attendance/checkAttendance', params, httpOptions).subscribe(async data => {
                    console.log('2nd api call');
                    console.log(data);
                    (await loader).dismiss();
                    await this.clockInOut(data);    // After this start detection again
                  });
                }
              });
            }
            else 
              await this.clockInOut(data);    // After this start detection again
          }
        }
        else{ //user not found 

          if (this.facecheckLoader != null) { //loading screen
            await this.facecheckLoader.dismiss();
            this.facecheckLoader = null;
          } 
          this.userNotFound = true;
          this.warningHeader = 'User Not Found';
          this.warningMsg = 'Please try again';
          this.timeout(2000).then(()=>{
            this.userNotFound = false;
          });
        }          
      });
    });
  }
  
  async clockInOut(data) {


    this.user = data['user'];
    this.shift_in = this.convertToTime(data['attendance']['shift_in_time']);
    this.shift_out = this.convertToTime(data['attendance']['shift_out_time']);
    this.user_type = data['attendance']['user_type'];
    this.dateTime = data['attendance']['updated_at'];
    this.storage.set('user',this.user).then(name => {
      this.initialSelectedName = name;
      console.log(`hersadafe ${name}`);
    });
    if(data['type'] == 'Clock In') {
      this.type = 'Clocked In';
    } else {
      this.type = 'Clocked Out';
    }

    console.log('creating modal');
    //show clocked in/out attendance modal 
    this.modalAttendance = await this.modalCtrl.create({
      component: ClockinoutPage,
      componentProps: { 
        user: this.user,
        user_type: this.user_type,
        type: this.type,
        shift_in: this.shift_in,
        shift_out: this.shift_out,
        dateTime: this.dateTime
      },
      cssClass: 'my-custom-class',
      showBackdrop: true,
    });
    if (this.facecheckLoader != null) {
      await this.facecheckLoader.dismiss();
      this.facecheckLoader = null;
    } 
    this.modalAttendance.isOpen = true;
    this.modalAttendance.present();
    console.log('modal presented');
    this.modalAttendance.onDidDismiss().then(()=> {
      this.modalAttendance = null;
      console.log('modal onDidDismiss');
    
    });
  }



  async presentToast(msg, color) {
    this.toast = await this.toastController.create({
      message: msg,
      duration: 1000,
      color: color,
      position: "middle",
    });
    this.toast.present(); 
    this.isToastOpen = true;
   
    await this.toast.onDidDismiss().then(()=>{
      this.isToastOpen = false;
    });
  }

  convertToTime(dateTime): string {
    console.log('debug');


    let date = new Date(dateTime);
    let dateString = date.toLocaleDateString('en-US', {
      day:'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric', 
      hour12:false
    });
    // E.g Oct 12, 2022, 09:00
    let arr = dateString.split(',');

    // Oct 12
    let mthDay = arr[0].split(' ');


    let day = mthDay[1];
    let mth = mthDay[0];
    let yr = arr[1];
    let time = arr[2];

    let newDateTime = `${day} ${mth} ${yr} ${time}`;
    console.log(newDateTime);
    return newDateTime;
  }

  async createLoader() {
    const loading = await this.loader.create({
      spinner: 'crescent',
      cssClass: 'loader',
      message: 'Loading',
    });
    return loading;
  }

  stopPreview() {
    
    CameraPreview.stop();
    clearInterval(this.myInterval);
    this.isBlackOut = true;

  }

  async resumeDetection(){
    this.blackScreenLoader = await this.loader.create({
      spinner: 'crescent',
      cssClass: 'loader',
      message: 'Initializing Camera',
    });

    (await this.blackScreenLoader).present();
    this.launchCamera();
    this.isBlackOut = false;

  }

  /**
   * Logs modal functions
   */

  async openLogs() {     
    this.isLogsOpen = true;
    clearInterval(this.myInterval);
    this.content.setAttribute('style','--overflow:hidden');
    this.content.scrollToTop(0);
    // let el = this.
    await this.getLogs(false, undefined);
  }

  refresh() {
    console.log('refreshing');
    let isFiltered = false;
    let logDiv = document.getElementById('logs-card');
    logDiv.innerHTML = '';
    this.logCached = {
      All: [],
      Clock_In: [],
      Clock_Out: []
    }
    this.clkinOffset = 0;
    this.clkoutOffset = 0;
    this.firstLoad = true;
    if (this.selectedName != 'All') {
      isFiltered = true;
    }
    this.getLogs(isFiltered, undefined);
  }
  
  getLogs(isFiltered, scrollEvent) {
    return new Promise<void>(async (resolve) =>{
      if(this.firstLoad) {
        var loader = this.createLoader();
        (await loader).present();
      }
  
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
          "attendance_id" : this.id,
          "clkinoffset" : this.clkinOffset,
          "clkoutoffset" : this.clkoutOffset
        };

        if(isFiltered) {
          params['user'] = this.selectedId;
        }
        else {
          if(params['user'] != null) {
            delete params['user'];
          }
        }


        console.log("debug");
        console.log(params);
  
        url = this.localUrl;
        this.http.post(url + '/api/attendance/getLogsV3', params, httpOptions).subscribe(async data => {
          
          
         
          this.createLogRows(data['all_logs'], 'All');
          this.createLogRows(data['clock_in_logs'], 'Clock_In');
          this.createLogRows(data['clock_out_logs'], 'Clock_Out');

          console.log("After query");
          console.log(data);

          if (this.firstLoad) {
            (await loader).dismiss();
            this.firstLoad = false;
          }

          let segment = document.getElementsByTagName('ion-segment')[0];
          let logCard = document.getElementById('logs-card');

          for (let i = 0; i < this.logCached[segment.value].length; i++) {
            logCard.append(this.logCached[segment.value][i]);
          }

          this.clkinOffset += data['clock_in_logs'].length;
          this.clkoutOffset += data['clock_out_logs'].length;

          if (scrollEvent != undefined)
            scrollEvent.target.complete();
          resolve();


        });
      });

    });

  }

  createLogRows(obj, type) {

    obj.forEach((log) =>{
      let el = document.createElement('div');
      
      let row1 = document.createElement('ion-row'); //create row  
      row1.setAttribute('class','logs-content'); //set css
      // insert " | "" into time date //
      let colValue = Object.values(log);
      let originaltime = <string> colValue[1];
      let timedatearr = originaltime.split(' ');
      let timedate = timedatearr[0] + ' ' + timedatearr[1] + ' ' + timedatearr[2] + ' | ' + timedatearr[3];
      // indicator //
      let col0 = <HTMLElement>document.createElement('ion-col');
      col0.setAttribute('class','logs-indicator');       
      row1.append(col0); //create col in same row 
      // name //
          let col1 = <HTMLElement>document.createElement('ion-col');
          col1.setAttribute('class','logs-col-name');       
          col1.innerHTML = "<b>"+<string> colValue[0] +"</b>"+"<br>"+"<br>"+ timedate; // name top date bottom
          row1.append(col1); //create col in same row 
      // date-time //
          let col3 = <HTMLElement>document.createElement('ion-col');
          col3.setAttribute('class','logs-col-clock');
          col3.innerHTML = (<string> colValue[2]);
          row1.append(col3); //create col in same row 

          if (colValue[2] == "Clock Out")
          {
            col0.setAttribute('class','logs-indicator-red'); 
          } 

          el.append(row1);
          this.logCached[type].push(el);
    });
  }

  
  segmentChanged(ev: any) {
    let logCard = document.getElementById('logs-card');
    logCard.innerText = '';
    console.log('--test');
    console.log(ev);
    console.log(this.logCached);
    switch(ev['detail']['value']) {
      case 'All':
        this.logCached.All.forEach((x) =>{
          logCard.append(x)
        });
        break;
      case 'Clock_In':
        console.log('clock in loop');
        this.logCached.Clock_In.forEach((x) =>{
          
          logCard.append(x)
        });
        break;
      case 'Clock_Out':
        console.log('clock out loop');
        this.logCached.Clock_Out.forEach((x) =>{
          logCard.append(x)
        });
        break;
    }


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

  closeLogModal() {
    console.log("closing log modal");
    this.isLogsOpen = false;
  
    this.logCached = {
      All: [],
      Clock_In: [],
      Clock_Out: []
    }
    this.selectedName = 'All';
    this.clkinOffset = 0;
    this.clkoutOffset = 0;
    this.firstLoad = true;

    this.startDetection();
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
      url = this.localUrl; 
      this.http.post(url + '/api/attendance/getAttendanceAssignmentUsers', params, httpOptions).subscribe(async data => {
        this.allUsers = data['users'];
        this.userLoaded = true;
        (await loader).dismiss();

      });
    });
  }

  showSelectedModal() {
    this.selectedModal = <HTMLElement>document.getElementsByClassName('selectedUserFilterModal')[0];
    this.selectedNameForBackBtn = this.selectedName;
    this.selectedName = '';
    this.selectedModal.style.display = 'block';
    this.selectedModal.style.animation = 'slide_left .2s linear';
    this.selectedModal.style.animationFillMode = 'forwards';
    this.selectedModal.style.zIndex = '1003';

  }

  selectedValue(name,id) {
    this.selectedName = name;
    this.selectedId = id;
    this.hideSelectedModal('selectUser',false);
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

  clearSearch(){
    this.selectedName = "All";
  }

  applyFilter() {
    this.clkinOffset = 0;
    this.clkoutOffset = 0;
    let logDiv = document.getElementById('logs-card');
    logDiv.innerHTML = '';
    this.logCached = {
      All: [],
      Clock_In: [],
      Clock_Out: []
    }
    this.firstLoad = true;
    this.getLogs(this.isFiltered(), undefined);  
    this.hideFilterModal(false);
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

  isFiltered() {
    return this.selectedName == 'All' ?  false : true;
  }

  loadData(event) {
    console.log('--debug');
    console.log(event);
    this.getLogs(this.isFiltered(), event);
  }

  /**
   * Details modal functions
   */
  async openDetails() {
    this.isDetailsOpen = true;
    clearInterval(this.myInterval);
    this.content.setAttribute('style','--overflow:hidden');
    this.content.scrollToTop(0);

    await new Promise<void>((resolve)=>{
      setTimeout(() => {
        resolve();
      }, 100);
    });

    let el = document.getElementById('ShiftTimeEmployee');
    el.innerHTML='';
    this.shift_hours_split.forEach((value)=> 
    {
      let row = document.createElement('ion-row');
      row.innerHTML = value + "hrs";
      el.append(row);
    });
    
    let el1 = document.getElementById('ShiftTimeSupervisor');
    el1.innerHTML='';
    this.shift_hours_supervisor_split.forEach((value)=> 
    {
      let row = document.createElement('ion-row');
      row.innerHTML = value + "hrs";
      el1.append(row);
    });
  }

  closeDetailsModal(){
    console.log('Close details modal');
    this.isDetailsOpen = false;

    this.startDetection();
  }

  timeout(time) {
    return new Promise<void>((resolve)=>{
      setTimeout(() => {
        resolve();
      }, time);
    });
  }

}