import { registerPlugin } from 'lumagrid';
import { createNativePlugin } from 'lumagrid';
import { HorizontalBarChart } from 'lumagrid/viz';

export const NATIVE_ID = 'ex-native';
registerPlugin(createNativePlugin(NATIVE_ID, HorizontalBarChart, 'Native SVG'));
