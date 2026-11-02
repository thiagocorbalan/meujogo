<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'

const props = defineProps<{
  data: Array<{ date: string; count: number }>
  label: string
}>()

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const chartData = computed(() => ({
  labels: props.data.map((d) => d.date),
  datasets: [
    {
      label: props.label,
      data: props.data.map((d) => d.count),
      backgroundColor: 'rgba(99, 102, 241, 0.7)',
      borderColor: 'rgb(99, 102, 241)',
      borderWidth: 1,
      borderRadius: 4,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { display: false },
    tooltip: { mode: 'index' as const, intersect: false },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { precision: 0 },
    },
  },
}

const ariaDescription = computed(() => {
  if (!props.data.length) return `${props.label}: sem dados`
  const total = props.data.reduce((sum, d) => sum + d.count, 0)
  const first = props.data[0].date
  const last = props.data[props.data.length - 1].date
  return `${props.label}: ${total} total entre ${first} e ${last}`
})
</script>

<template>
  <div>
    <!-- Visually hidden table fallback for screen readers -->
    <table class="sr-only" :aria-label="ariaDescription">
      <caption>{{ props.label }}</caption>
      <thead>
        <tr>
          <th scope="col">Data</th>
          <th scope="col">Quantidade</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in props.data" :key="row.date">
          <td>{{ row.date }}</td>
          <td>{{ row.count }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Chart visible to sighted users -->
    <div aria-hidden="true">
      <Bar
        v-if="props.data.length"
        :data="chartData"
        :options="chartOptions"
      />
      <p v-else class="text-sm text-muted-foreground py-6 text-center">Sem dados para exibir</p>
    </div>
  </div>
</template>
