import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './component/login/login.component';
import { NgModule } from '@angular/core';
import { GalleryComponent } from './component/gallery/gallery.component';
import { AuthGuard } from './service/auth/auth.guard';
import { RegisterComponent } from './component/register/register.component';
import { EditorComponent } from './component/editor/editor.component';

export const routes: Routes = [
  {
    path: 'gallery',
    component: GalleryComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'editor',
    component: EditorComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'register', 
    component: RegisterComponent },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}