import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PreviewPageRoutingModule } from './preview-routing.module';
import { PreviewPage } from './preview.page';
import { NgxFaceApiJsModule } from 'ngx-face-api-js';
import {CameraPreview} from '@capacitor-community/camera-preview';
import { ComponentsModule } from '../components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PreviewPageRoutingModule,
    ComponentsModule
  ],
  declarations: [
    PreviewPage,
  ],

  
})
export class PreviewPageModule {}