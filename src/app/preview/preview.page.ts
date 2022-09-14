import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Plugins } from "@capacitor/core"
const { CameraPreview } = Plugins;
import { CameraPreviewOptions, CameraPreviewPictureOptions, CameraSampleOptions } from '@capacitor-community/camera-preview';
import '@capacitor-community/camera-preview';
import { ModalController, NavController, ToastController } from '@ionic/angular';
import * as faceapi from 'face-api.js';
// import { File } from '@awesome-cordova-plugins/file/ngx';
// import { TouchSequence } from 'selenium-webdriver';
import { GlobalProviderService } from '../services/global-provider.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ClockinoutPage } from '../clockinout/clockinout.page';

import { Executor } from 'selenium-webdriver';
import { SupvOptionComponent } from '../supv-option/supv-option.component';
import { resolve } from 'dns';

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
  isModalOpen = false;

  modalAttendance:HTMLIonModalElement;
  toast:HTMLIonToastElement;
  isToastOpen = false;



  constructor(private global: GlobalProviderService, private http : HttpClient, public toastController: ToastController, private modalCtrl:ModalController) {}

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

    let logBtn = document.getElementById('logs');
    logBtn.addEventListener("click", ()=>{clearInterval(this.myInterval)});
    let detailsBtn = document.getElementById('details');
    detailsBtn.addEventListener("click", ()=>{clearInterval(this.myInterval)});
    this.launchCamera();
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

}