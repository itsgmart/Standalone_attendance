import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Plugins } from "@capacitor/core"
const { CameraPreview } = Plugins;
import { CameraPreviewOptions, CameraPreviewPictureOptions, CameraSampleOptions } from '@capacitor-community/camera-preview';
import '@capacitor-community/camera-preview';
import { ModalController, NavController, ToastController, LoadingController  } from '@ionic/angular';
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
  faceWarning = 'Please move closer/stay within camera';
  warningShown = false;
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

  constructor(private global: GlobalProviderService, private http : HttpClient, public toastController: ToastController, private modalCtrl:ModalController, private loader:LoadingController) {}

  ngOnInit() {
    console.log('initialising preview page');
    // faceapi.nets.tinyFaceDetector.load('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
    console.log('loaded face model ', faceapi.nets.tinyFaceDetector.isLoaded);
  }

  async ionViewDidEnter() {
    console.log('entering preview page');
    await new Promise<void>((resolve)=>{
      setTimeout(()=>{
        resolve();
      },100);
    });

    this.launchCamera();
    this.content = document.getElementById('contentPage');
    this.storage.get('attendance_assignment').then((data)=>{
      console.log("--debug");
      console.log(data['attendance_assignment']);
      this.assignment = data['attendance_assignment'];

      this.shift_hours_split = this.assignment.shift_hours.split("|");
      this.shift_hours_supervisor_split = this.assignment.shift_hours_supervisor.split("|");
      
    });
  

    
    


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
    this.storage.get("attendance_assignment").then( (data) => {  
      this.id = data['attendance_assignment']['id'];    
      console.log("id inside",this.id); 
    });


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
      console.log(this.detection);

      this.processImage();
    
    }, 1000);


  }

  async processImage() {

    if(this.isDisplayShown()) {
      this.warningShown = false;
      this.hideInfoDisplay();
      this.count = this.maxCount;
      return;
    }

    this.showInfoDisplay();
    if (this.detection == undefined) {
      if(this.modalAttendance != undefined) {
        if(this.modalAttendance.isOpen) {
          this.modalAttendance.dismiss();
          this.modalAttendance.isOpen = false;
        }
      }



      this.count = this.maxCount; 
      console.log("Count:",this.count);
      this.faceDetected = false;
      this.warningShown = false;
    } 
    else {  // Face is detected
      let detect_width = this.detection.box.width;
      let detect_height = this.detection.box.height;

      // check if face is big enough, else show msg
      if (this.isBigEnough(detect_width, detect_height))  {   
        console.log('face is big enough');
        this.faceDetected = true;
        this.warningShown = false;
        this.count -= 1; 
      }
      else {
        console.log('face too far away');      
        this.hideInfoDisplay();
        this.warningShown = true;
        this.count = this.maxCount;
      }

      // if count reach 0, take picture and check face, and stop detection
      console.log("Count:",this.count); 
      if (this.count == 0) {  
        console.log("Take picture"); 
        this.faceDetected = false;
        this.count = this.maxCount;
        this.rawImageCheck = this.rawImage;
        console.log('stop detection');
        // clearInterval(this.myInterval);
        this.checkFace();
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

  isDisplayShown() {
    let detailsCard = document.getElementById('detailsCard');
    return (detailsCard != null);
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

    const toast = await this.toastController.create({
      message: 'Face detected, please wait...',
      color: 'success',
      position: "middle"
    });
    
    if(this.modalAttendance == undefined) {
      toast.present();
    }
    else if(this.modalAttendance.isOpen == false){
      toast.present();
    }
    
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
        "location_id" : this.id
      };
      console.log("params:", params);
      console.log(url);
      // url = "http://192.168.0.155";
      this.http.post(url + '/api/attendance/checkAttendance', params, httpOptions).subscribe(async data => {
        console.log(data);
        toast.dismiss();
        // check if face is in aws face collection
        if(data) {

          // if unable to clock in/out, show msg on toast
          // else get data to display on attendanceModal
          if(data['status'] != null) {
            let status = data['status'];

            switch(status) {
              case 'Too fast':
                if(this.modalAttendance == undefined) {
                  if (this.isToastOpen ) 
                    this.toast.dismiss();
                  await this.presentToast(status, "warning");
                }
                else if(this.modalAttendance.isOpen == false){
                  if (this.isToastOpen) 
                    this.toast.dismiss();
                  await this.presentToast(status, "warning");
                }
                break;
              case 'not assigned to location':
                if(this.modalAttendance == undefined) {
                  if (this.isToastOpen ) 
                    this.toast.dismiss();
                  await this.presentToast(status, "warning");
                }
                else if(this.modalAttendance.isOpen == false){
                  if (this.isToastOpen ) 
                    this.toast.dismiss();
                  await this.presentToast(status, "warning");
                }
                break;    
            }


          } else{
            await this.clockInOut(data);    // After this start detection again
          }
        }
        else{

          if(this.modalAttendance == undefined) {
            if (this.isToastOpen ) 
              this.toast.dismiss();
            await this.presentToast("Face not found", "danger");
          }
          else if(this.modalAttendance.isOpen == false){
            if (this.isToastOpen ) 
              this.toast.dismiss();
            await this.presentToast("Face not found", "danger");
          }
    
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
      this.type = 'Clocked In:';
      if(this.user_type == 'supervisor') {  
        console.log('creating modal for Supervisor Option');
        const modal = await this.modalCtrl.create({
          component: SupvOptionComponent,
          cssClass: 'supvOptionModal',
          showBackdrop: true,
          backdropDismiss: false
        });
        await modal.present();
        console.log('modal presented');
        await modal.onDidDismiss().then(data=>{

          if (data['data']['role'] != undefined) {
            this.user_type = data['data']['role'];
          }
        });
      }

    } else {
      this.type = 'Clocked Out:';
      
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
    this.modalAttendance.isOpen = true;
    this.modalAttendance.present();
    console.log('modal presented');
    this.modalAttendance.onDidDismiss().then(()=> {
      console.log('modal onDidDismiss');
    
    });
  }



  async presentToast(msg, color) {
    this.toast = await this.toastController.create({
      message: msg,
      duration: 1000,
      color: color,
      position: "middle"
    });
    this.toast.present(); 
    this.isToastOpen = true;
   
    await this.toast.onDidDismiss().then(()=>{
      this.isToastOpen = false;
    });
  }

  convertToTime(dateTime): string {
    return dateTime.split("-")[2].split(" ")[1];
  }



  async createLoader() {
    const loading = await this.loader.create();
    return loading;
  }

  refresh() {
    window.location.reload();
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
  
        url = "http://192.168.0.155";
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


      this.logCached[type].push(row);

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
      url = "http://192.168.0.155"; 
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

  dismissDetailsModal(){
    console.log('Close details modal');
    this.isDetailsOpen = false;

    this.startDetection();
  }




}