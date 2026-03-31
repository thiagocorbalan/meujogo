import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import ConfiguracoesPage from '../pages/configuracoes.vue';

const mockResetData = vi.fn();
const mockCloseAndRenewSeason = vi.fn();
const mockGetSettings = vi.fn().mockResolvedValue({
  maxTeams: 4,
  playersPerTeam: 5,
  sessionDurationMin: 120,
  matchDurationMin: 10,
  maxConsecutiveGames: 2,
  drawMode: 'ALEATORIO',
  defaultElo: 1200,
  kFactor: 32,
  vests: [],
});
const mockUpdateSettings = vi.fn();
const mockCanEdit = vi.fn().mockReturnValue(true);
const mockCanDelete = vi.fn().mockReturnValue(true);

vi.stubGlobal('usePermissions', () => ({
  canEdit: mockCanEdit,
  canDelete: mockCanDelete,
}));

vi.stubGlobal('useSettings', () => ({
  getSettings: mockGetSettings,
  updateSettings: mockUpdateSettings,
  resetData: mockResetData,
}));

vi.stubGlobal('useSeasons', () => ({
  closeAndRenewSeason: mockCloseAndRenewSeason,
}));

vi.stubGlobal('ref', ref);
vi.stubGlobal('onMounted', (cb: () => void) => cb());

const stubComponents = {
  Card: { template: '<div class="card"><slot /></div>' },
  CardHeader: { template: '<div><slot /></div>' },
  CardTitle: { template: '<div class="card-title"><slot /></div>' },
  CardContent: { template: '<div><slot /></div>' },
  BaseButton: {
    template: '<button :disabled="loading" @click="$emit(\'click\')"><slot /></button>',
    props: ['variant', 'size', 'loading', 'type'],
    emits: ['click'],
  },
  BaseModal: {
    template: '<div v-if="show" class="modal"><div class="modal-title">{{ title }}</div><slot /><slot name="footer" /></div>',
    props: ['show', 'title'],
    emits: ['close'],
  },
  Input: { template: '<input />' },
  Label: { template: '<label><slot /></label>' },
};

describe('Configurações - Gerenciamento de Dados', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanDelete.mockReturnValue(true);
    mockCanEdit.mockReturnValue(true);
    mockResetData.mockResolvedValue({ message: 'ok' });
    mockCloseAndRenewSeason.mockResolvedValue({ id: 1 });
  });

  function mountPage() {
    return mount(ConfiguracoesPage, {
      global: {
        stubs: stubComponents,
      },
    });
  }

  it('should render "Gerenciamento de Dados" section for ADMIN', async () => {
    const wrapper = mountPage();
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const titles = wrapper.findAll('.card-title');
    const dataManagement = titles.find((t) => t.text().includes('Gerenciamento de Dados'));
    expect(dataManagement).toBeTruthy();
  });

  it('should NOT render "Gerenciamento de Dados" section for non-ADMIN', async () => {
    mockCanDelete.mockReturnValue(false);
    const wrapper = mountPage();
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const titles = wrapper.findAll('.card-title');
    const dataManagement = titles.find((t) => t.text().includes('Gerenciamento de Dados'));
    expect(dataManagement).toBeUndefined();
  });

  it('should open reset modal when clicking "Resetar Dados"', async () => {
    const wrapper = mountPage();
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const buttons = wrapper.findAll('button');
    const resetBtn = buttons.find((b) => b.text().includes('Resetar Dados'));
    expect(resetBtn).toBeTruthy();

    await resetBtn!.trigger('click');
    await wrapper.vm.$nextTick();

    const modals = wrapper.findAll('.modal');
    const resetModal = modals.find((m) => m.text().includes('Confirmar Reset'));
    expect(resetModal).toBeTruthy();
  });

  it('should open season modal when clicking "Encerrar Temporada Atual"', async () => {
    const wrapper = mountPage();
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const buttons = wrapper.findAll('button');
    const seasonBtn = buttons.find((b) => b.text().includes('Encerrar Temporada Atual'));
    expect(seasonBtn).toBeTruthy();

    await seasonBtn!.trigger('click');
    await wrapper.vm.$nextTick();

    const modals = wrapper.findAll('.modal');
    const seasonModal = modals.find((m) => m.text().includes('temporada atual será encerrada'));
    expect(seasonModal).toBeTruthy();
  });

  it('should call resetData API when confirming reset', async () => {
    const wrapper = mountPage();
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const buttons = wrapper.findAll('button');
    const resetBtn = buttons.find((b) => b.text().includes('Resetar Dados'));
    await resetBtn!.trigger('click');
    await wrapper.vm.$nextTick();

    const allButtons = wrapper.findAll('button');
    const confirmBtn = allButtons.find((b) => b.text().includes('Confirmar Reset'));
    await confirmBtn!.trigger('click');
    await wrapper.vm.$nextTick();

    expect(mockResetData).toHaveBeenCalledTimes(1);
  });

  it('should call closeAndRenewSeason API when confirming season close', async () => {
    const wrapper = mountPage();
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const buttons = wrapper.findAll('button');
    const seasonBtn = buttons.find((b) => b.text().includes('Encerrar Temporada Atual'));
    await seasonBtn!.trigger('click');
    await wrapper.vm.$nextTick();

    const allButtons = wrapper.findAll('button');
    const confirmBtn = allButtons.find((b) => b.text() === 'Confirmar');
    await confirmBtn!.trigger('click');
    await wrapper.vm.$nextTick();

    expect(mockCloseAndRenewSeason).toHaveBeenCalledTimes(1);
  });

  it('should show error in modal when reset fails', async () => {
    mockResetData.mockRejectedValueOnce({ data: { message: 'Erro no servidor' } });

    const wrapper = mountPage();
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const buttons = wrapper.findAll('button');
    const resetBtn = buttons.find((b) => b.text().includes('Resetar Dados'));
    await resetBtn!.trigger('click');
    await wrapper.vm.$nextTick();

    const allButtons = wrapper.findAll('button');
    const confirmBtn = allButtons.find((b) => b.text().includes('Confirmar Reset'));
    await confirmBtn!.trigger('click');

    await new Promise((r) => setTimeout(r, 10));
    await wrapper.vm.$nextTick();

    const modal = wrapper.findAll('.modal').find((m) => m.text().includes('Confirmar Reset'));
    expect(modal).toBeTruthy();
    expect(wrapper.text()).toContain('Erro no servidor');
  });

  it('should show error in modal when season close fails', async () => {
    mockCloseAndRenewSeason.mockRejectedValueOnce({ data: { message: 'Temporada erro' } });

    const wrapper = mountPage();
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const buttons = wrapper.findAll('button');
    const seasonBtn = buttons.find((b) => b.text().includes('Encerrar Temporada Atual'));
    await seasonBtn!.trigger('click');
    await wrapper.vm.$nextTick();

    const allButtons = wrapper.findAll('button');
    const confirmBtn = allButtons.find((b) => b.text() === 'Confirmar');
    await confirmBtn!.trigger('click');

    await new Promise((r) => setTimeout(r, 10));
    await wrapper.vm.$nextTick();

    const modal = wrapper.findAll('.modal').find((m) => m.text().includes('Confirmar'));
    expect(modal).toBeTruthy();
    expect(wrapper.text()).toContain('Temporada erro');
  });
});
