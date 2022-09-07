import { Component } from '@angular/core';
import * as faceapi from 'face-api.js';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor() {
    console.log('loading face modals');
    // faceapi.nets.tinyFaceDetector.load('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
    faceapi.nets.tinyFaceDetector.loadFromUri('../../assets/weights');
  }
}
