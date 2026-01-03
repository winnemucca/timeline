import 'zone.js';
import 'zone.js/testing';
import '@angular/localize/init'; // this is the fix for ngbootstrap

import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
// testing this through chatgpt trying to solve localize issue with ngb datepicker
// MUST be first — before Angular loads anything
(globalThis as any).$localize = (msg: any) => msg;

// Optional but safe
(globalThis as any).$localize.locale = 'en';

getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
