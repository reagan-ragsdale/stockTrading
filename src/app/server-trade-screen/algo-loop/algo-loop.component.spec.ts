import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlgoLoopComponent } from './algo-loop.component';

describe('AlgoLoopComponent', () => {
  let component: AlgoLoopComponent;
  let fixture: ComponentFixture<AlgoLoopComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlgoLoopComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlgoLoopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
