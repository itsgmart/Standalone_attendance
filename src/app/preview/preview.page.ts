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
import { LogsPage } from '../logs/logs.page';

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
  count = 4;
  maxCount = 4;
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


  constructor(private global: GlobalProviderService, private http : HttpClient, public toastController: ToastController, private modalCtrl:ModalController) {}

  ngOnInit() {
    console.log('initialising preview page');
  }

  ionViewDidEnter() {
    console.log('entering preview page');
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
      height: this.height, //height of the camera
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

    if (this.detection == undefined) { 
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
        this.faceDetected = false;
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
        clearInterval(this.myInterval);
        this.checkFace();
      } 
      this.resizedDetections = faceapi.resizeResults(
          this.detection, 
          this.displaySize
      );
    }  
  }



  isBigEnough(detect_width,detect_height):boolean {
    if (detect_width >= (1/6)*this.width && detect_height >= (1/6)*this.height) { // Decrease to make box smaller
      return true;
    }
    else {
      return false;
    }
  }

  async checkFace() {
    const toast = await this.toastController.create({
      message: 'Face found, please wait...',
      color: 'success',
      position: "middle"
    });
    toast.present();
    
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
      url = "http://192.168.0.154";
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
                await this.presentToast(status, "warning");
                break;
              case 'not assigned to location':
                await this.presentToast(status, "warning");
                break;    
            }

            // Continue dectection
            this.startDetection();

          } else{
            await this.clockInOut(data);    // After this start detection again
          }
        }
        else{
          await this.presentToast("Face not found", "danger");

          // Continue dectection
          this.startDetection();
        }          

      });
    });
  }
  
  async clockInOut(data) {
    let shift_in, shift_out, user_type, user, dateTime, type;

    user = data['user'];
    shift_in = this.convertToTime(data['attendance']['shift_in_time']);
    shift_out = this.convertToTime(data['attendance']['shift_out_time']);
    user_type = data['attendance']['user_type'];
    dateTime = data['attendance']['updated_at'];
    this.storage.set('user',user).then(name => {
      console.log(`hersadafe ${name}`);
    });
    if(data['type'] == 'Clock In') {
      type = 'Clocked In:';
     

    } else {
      type = 'Clocked Out:';
    }
    
    //show clocked in/out attendance modal 
    const modal = await this.modalCtrl.create({
      component: ClockinoutPage,
      componentProps: { 
        user: user,
        user_type: user_type,
        type: type,
        shift_in: shift_in,
        shift_out: shift_out,
        dateTime: dateTime
      },
      cssClass: 'my-custom-class',
      showBackdrop: true,
    });
    await modal.present();
    console.log('modal presented');
    modal.onDidDismiss().then(()=> {
      console.log('modal onDidDismiss');
      this.startDetection();
    });
  }

  async presentToast(msg, color) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 1000,
      color: color,
      position: "middle"
    });
    toast.present();
    const { role } = await toast.onDidDismiss();
  }

  convertToTime(dateTime): string {
    return dateTime.split("-")[2].split(" ")[1];
  }

}