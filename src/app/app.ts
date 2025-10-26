import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexTitleSubtitle, ApexLegend, ApexPlotOptions } from 'ng-apexcharts';
import { ChartComponent } from 'ng-apexcharts';
import * as XLSX from 'xlsx';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  title: ApexTitleSubtitle;
  legend: ApexLegend;
  plotOptions?: ApexPlotOptions;
  colors?: string[];
};

@Component({
  selector: 'app-root',
  imports: [ChartComponent, FormsModule, CommonModule],
  standalone: true,
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  data: any[] = [];
  countries: string[] = [];
  selectedCountries: string[] = [];
  selectedCountry1: string = '';
  selectedYear1: number | null = null;
  selectedYear2: number | null = null;

  chartOptions: Partial<ChartOptions> | any;
  stats: Record<string, any> = {};

  ngOnInit() {
    const savedData = localStorage.getItem('excelData');
    if (savedData) {
      this.data = JSON.parse(savedData);
      this.countries = this.data.map((r: any) => r['Country Name']);
    }
  }

  // 📂 Leer archivo Excel y guardar en localStorage
  onFileChange(event: any) {
    const target: DataTransfer = <DataTransfer>(event.target);
    if (target.files.length !== 1) return;

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const wb: XLSX.WorkBook = XLSX.read(e.target.result, { type: 'binary' });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      this.data = XLSX.utils.sheet_to_json(ws);
      this.countries = this.data.map((r: any) => r['Country Name']);
      localStorage.setItem('excelData', JSON.stringify(this.data));
      alert('✅ Datos cargados y guardados en el navegador');
    };
    reader.readAsBinaryString(target.files[0]);
  }

  // 📊 Mostrar países seleccionados con histograma
  showSelected() {
    if (!this.selectedCountries.length) {
      alert('Selecciona al menos un país');
      return;
    }

    const years = Object.keys(this.data[0])
      .filter((y) => !isNaN(Number(y)) && Number(y) >= 1900)
      .sort((a, b) => Number(a) - Number(b));

    const series = this.selectedCountries.map((name) => {
      const row = this.data.find((r) => r['Country Name'] === name);
      const values = years.map((y) => Number(row?.[y] || 0));
      this.stats[name] = this.calculateStats(values);
      return { name, data: values };
    });

    this.chartOptions = {
      series,
      chart: { type: 'bar', height: 400 },
      title: { text: `Histograma: ${this.selectedCountries.join(', ')}`, align: 'center' },
      xaxis: { categories: years, title: { text: 'Año' } },
      plotOptions: {
        bar: { horizontal: false, columnWidth: '70%', borderRadius: 4 }
      },
      legend: { position: 'top' },
      colors: ['#008FFB', '#FF4560', '#00E396', '#FEB019', '#775DD0']
    };
  }

  // 📆 Comparar dos años de un país y mostrar histograma
  compareYears() {
    if (!this.selectedCountry1 || !this.selectedYear1 || !this.selectedYear2) {
      alert('Selecciona un país y dos años para comparar.');
      return;
    }

    const country = this.data.find((d) => d['Country Name'] === this.selectedCountry1);
    if (!country) {
      alert('País no encontrado.');
      return;
    }

    const value1 = Number(country[this.selectedYear1]);
    const value2 = Number(country[this.selectedYear2]);
    const diff = value2 - value1;

    alert(`📅 ${this.selectedCountry1}
${this.selectedYear1}: ${value1.toLocaleString()}
${this.selectedYear2}: ${value2.toLocaleString()}
Cambio: ${diff.toLocaleString()}`);

    // Mostrar como histograma de dos barras
    this.chartOptions = {
      series: [
        {
          name: this.selectedCountry1,
          data: [value1, value2]
        }
      ],
      chart: { type: 'bar', height: 400 },
      title: {
        text: `Comparación de ${this.selectedCountry1}: ${this.selectedYear1} vs ${this.selectedYear2}`,
        align: 'center'
      },
      xaxis: { categories: [String(this.selectedYear1), String(this.selectedYear2)] },
      colors: ['#00E396'],
      plotOptions: {
        bar: { columnWidth: '50%', borderRadius: 6 }
      },
      legend: { position: 'top' }
    };
  }

  // 📈 Cálculos estadísticos
  calculateStats(values: number[]) {
    const n = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / n;
    const variance = values.reduce((a, b) => a + (b - avg) ** 2, 0) / n;
    const stddev = Math.sqrt(variance);
    const mode = this.mode(values);
    return {
      max: Math.max(...values),
      min: Math.min(...values),
      sum,
      avg,
      mode,
      variance,
      stddev
    };
  }

  mode(arr: number[]) {
    const freq: Record<number, number> = {};
    arr.forEach((v) => (freq[v] = (freq[v] || 0) + 1));
    return Number(Object.keys(freq).reduce((a: any, b: any) => (freq[a] > freq[b] ? a : b)));
  }
}
