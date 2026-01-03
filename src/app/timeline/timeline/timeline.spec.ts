import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Timeline } from './timeline';

describe('Timeline', () => {
  let component: Timeline;
  let fixture: ComponentFixture<Timeline>;

  beforeEach(async () => {
    Element.prototype.scrollTo = vi.fn();

    await TestBed.configureTestingModule({
      imports: [Timeline],
    }).compileComponents();

    fixture = TestBed.createComponent(Timeline);
    component = fixture.componentInstance;

    fixture.detectChanges(); // 🔴 REQUIRED for signals/effects
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to day timescale', () => {
    expect(component.timescale()).toBe('day');
  });

  it('should generate units for the active range', () => {
    const units = component.units();
    expect(units.length).toBeGreaterThan(0);
    expect(units[0]).toBeInstanceOf(Date);
  });

  it('should compute todayOffsetPx when today is in range', () => {
    const offset = component.todayOffsetPx();
    expect(offset).not.toBeNull();
    expect(typeof offset).toBe('number');
  });

  it('should change timescale when control value changes', () => {
    component.timescaleControl.setValue('week');
    fixture.detectChanges();

    expect(component.timescale()).toBe('week');
  });
});
