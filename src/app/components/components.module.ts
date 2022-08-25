import { NgModule } from '@angular/core';
import { NavbarComponent } from './navbar/navbar.component';
import { DetailsComponent } from './details/details.component';
import { CommonModule } from '@angular/common';

@NgModule({
    imports: [CommonModule],
    declarations: [NavbarComponent, DetailsComponent],
    exports: [NavbarComponent, DetailsComponent]
})
export class ComponentsModule{}