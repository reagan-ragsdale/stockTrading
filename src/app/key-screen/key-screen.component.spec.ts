import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeyScreenComponent } from './key-screen.component';

describe('KeyScreenComponent', () => {
  let component: KeyScreenComponent;
  let fixture: ComponentFixture<KeyScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KeyScreenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KeyScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
