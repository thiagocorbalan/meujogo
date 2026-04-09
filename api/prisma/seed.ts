import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function generateInviteCode(): string {
  return crypto.randomBytes(6).toString('hex');
}

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('12345678', 10);

  // ──────────────────────────────────────────────
  // 1. Clean up existing data (order matters for FK)
  // ──────────────────────────────────────────────
  await prisma.$transaction([
    prisma.goal.deleteMany(),
    prisma.matchEvent.deleteMany(),
    prisma.match.deleteMany(),
    prisma.teamPlayer.deleteMany(),
    prisma.team.deleteMany(),
    prisma.champion.deleteMany(),
    prisma.attendance.deleteMany(),
    prisma.session.deleteMany(),
    prisma.season.deleteMany(),
    prisma.vest.deleteMany(),
    prisma.settings.deleteMany(),
    prisma.groupMember.deleteMany(),
    prisma.player.deleteMany(),
    prisma.group.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log('Cleaned existing data.');

  // ──────────────────────────────────────────────
  // 2. Users
  // ──────────────────────────────────────────────
  const marcos = await prisma.user.create({
    data: {
      name: 'Marcos Silva',
      email: 'marcos@teste.com',
      password: hashedPassword,
      role: 'USUARIO',
    },
  });

  const rafael = await prisma.user.create({
    data: {
      name: 'Rafael Santos',
      email: 'rafael@teste.com',
      password: hashedPassword,
      role: 'USUARIO',
    },
  });

  const fernanda = await prisma.user.create({
    data: {
      name: 'Fernanda Costa',
      email: 'fernanda@teste.com',
      password: hashedPassword,
      role: 'USUARIO',
    },
  });

  console.log(
    `Users created: ${marcos.name}, ${rafael.name}, ${fernanda.name}`,
  );

  // ──────────────────────────────────────────────
  // 3. Groups
  // ──────────────────────────────────────────────
  const group1 = await prisma.group.create({
    data: {
      name: 'Pelada do Marcos',
      slug: 'pelada-do-marcos',
      description: 'Pelada semanal organizada pelo Marcos',
      dayOfWeek: 4,
      defaultTime: '19:00',
      address: 'Quadra Society Arena, Rua das Flores 123',
      inviteCode: generateInviteCode(),
    },
  });

  const group2 = await prisma.group.create({
    data: {
      name: 'Racha da Quinta',
      slug: 'racha-da-quinta',
      description: 'Racha toda quinta-feira no campo do Seu Ze',
      dayOfWeek: 4,
      defaultTime: '20:30',
      address: 'Campo do Seu Ze, Av. Brasil 456',
      inviteCode: generateInviteCode(),
    },
  });

  console.log(`Groups created: ${group1.name}, ${group2.name}`);

  // ──────────────────────────────────────────────
  // 4. Players — Group 1 (Pelada do Marcos)
  // ──────────────────────────────────────────────

  // Players linked to users
  const marcosG1 = await prisma.player.create({
    data: {
      name: 'Marcos Silva',
      position: 'LINHA',
      type: 'FIXO',
      elo: 1250,
      groupId: group1.id,
      userId: marcos.id,
    },
  });

  const rafaelG1 = await prisma.player.create({
    data: {
      name: 'Rafael Santos',
      position: 'LINHA',
      type: 'FIXO',
      elo: 1100,
      groupId: group1.id,
      userId: rafael.id,
    },
  });

  const fernandaG1 = await prisma.player.create({
    data: {
      name: 'Fernanda Costa',
      position: 'GOLEIRO',
      type: 'FIXO',
      elo: 1150,
      groupId: group1.id,
      userId: fernanda.id,
    },
  });

  // Manual players (no userId)
  const joaoPedroG1 = await prisma.player.create({
    data: {
      name: 'Joao Pedro',
      position: 'LINHA',
      type: 'FIXO',
      groupId: group1.id,
    },
  });

  const carlosEduardoG1 = await prisma.player.create({
    data: {
      name: 'Carlos Eduardo',
      position: 'LINHA',
      type: 'FIXO',
      groupId: group1.id,
    },
  });

  const brunoHenriqueG1 = await prisma.player.create({
    data: {
      name: 'Bruno Henrique',
      position: 'LINHA',
      type: 'CONVIDADO',
      groupId: group1.id,
    },
  });

  const lucasGabrielG1 = await prisma.player.create({
    data: {
      name: 'Lucas Gabriel',
      position: 'LINHA',
      type: 'FIXO',
      groupId: group1.id,
    },
  });

  console.log(
    `Group 1 players: ${[marcosG1, rafaelG1, fernandaG1, joaoPedroG1, carlosEduardoG1, brunoHenriqueG1, lucasGabrielG1].map((p) => p.name).join(', ')}`,
  );

  // ──────────────────────────────────────────────
  // 5. Players — Group 2 (Racha da Quinta)
  // ──────────────────────────────────────────────

  // Players linked to users
  const marcosG2 = await prisma.player.create({
    data: {
      name: 'Marcos Silva',
      position: 'LINHA',
      type: 'FIXO',
      elo: 1180,
      groupId: group2.id,
      userId: marcos.id,
    },
  });

  const rafaelG2 = await prisma.player.create({
    data: {
      name: 'Rafael Santos',
      position: 'LINHA',
      type: 'FIXO',
      elo: 1200,
      groupId: group2.id,
      userId: rafael.id,
    },
  });

  // Manual players (no userId)
  const andreLuisG2 = await prisma.player.create({
    data: {
      name: 'Andre Luis',
      position: 'LINHA',
      type: 'FIXO',
      groupId: group2.id,
    },
  });

  const pedroHenriqueG2 = await prisma.player.create({
    data: {
      name: 'Pedro Henrique',
      position: 'LINHA',
      type: 'FIXO',
      groupId: group2.id,
    },
  });

  const gustavoG2 = await prisma.player.create({
    data: {
      name: 'Gustavo',
      position: 'GOLEIRO',
      type: 'FIXO',
      groupId: group2.id,
    },
  });

  console.log(
    `Group 2 players: ${[marcosG2, rafaelG2, andreLuisG2, pedroHenriqueG2, gustavoG2].map((p) => p.name).join(', ')}`,
  );

  // ──────────────────────────────────────────────
  // 6. GroupMembers — linking users to groups
  // ──────────────────────────────────────────────

  // Group 1
  await prisma.groupMember.create({
    data: {
      groupId: group1.id,
      userId: marcos.id,
      playerId: marcosG1.id,
      role: 'DONO',
    },
  });

  await prisma.groupMember.create({
    data: {
      groupId: group1.id,
      userId: rafael.id,
      playerId: rafaelG1.id,
      role: 'ADMIN',
    },
  });

  await prisma.groupMember.create({
    data: {
      groupId: group1.id,
      userId: fernanda.id,
      playerId: fernandaG1.id,
      role: 'JOGADOR',
    },
  });

  // Group 2
  await prisma.groupMember.create({
    data: {
      groupId: group2.id,
      userId: marcos.id,
      playerId: marcosG2.id,
      role: 'DONO',
    },
  });

  await prisma.groupMember.create({
    data: {
      groupId: group2.id,
      userId: rafael.id,
      playerId: rafaelG2.id,
      role: 'JOGADOR',
    },
  });

  console.log('GroupMembers created.');

  // ──────────────────────────────────────────────
  // 7. Settings per group
  // ──────────────────────────────────────────────
  const settings1 = await prisma.settings.create({
    data: {
      groupId: group1.id,
      maxTeams: 4,
      playersPerTeam: 5,
      sessionDurationMin: 90,
      matchDurationMin: 10,
      drawMode: 'EQUILIBRADO',
      defaultElo: 1200,
      kFactor: 32,
      maxConsecutiveGames: 2,
      rules:
        'Regras da Pelada do Marcos:\n1. Horario: 19h - pontualidade!\n2. Cada jogador paga R$15\n3. Goleiro nao paga\n4. Time que perde sai\n5. Maximo 2 jogos seguidos\n6. Respeito acima de tudo',
      paymentInfo:
        'PIX: marcos@teste.com\nValor: R$15,00 por jogador\nPagar antes do jogo',
    },
  });

  const settings2 = await prisma.settings.create({
    data: {
      groupId: group2.id,
      maxTeams: 3,
      playersPerTeam: 4,
      sessionDurationMin: 60,
      matchDurationMin: 8,
      drawMode: 'ALEATORIO',
      defaultElo: 1200,
      kFactor: 32,
      maxConsecutiveGames: 2,
      rules:
        'Regras do Racha da Quinta:\n1. Horario: 20h30\n2. R$10 por cabeca\n3. Sorteio aleatorio dos times\n4. Jogo de 8 minutos\n5. Sem reclamacao com juiz',
      paymentInfo:
        'PIX: marcos@teste.com\nValor: R$10,00\nPagar no local ou antecipado',
    },
  });

  console.log('Settings created.');

  // ──────────────────────────────────────────────
  // 8. Vests per group's settings
  // ──────────────────────────────────────────────

  // Group 1 vests (4 teams)
  await prisma.vest.createMany({
    data: [
      { name: 'Branco', color: '#FFFFFF', settingsId: settings1.id },
      { name: 'Vermelho', color: '#FF0000', settingsId: settings1.id },
      { name: 'Azul', color: '#0000FF', settingsId: settings1.id },
      { name: 'Verde', color: '#00FF00', settingsId: settings1.id },
    ],
  });

  // Group 2 vests (3 teams)
  await prisma.vest.createMany({
    data: [
      { name: 'Preto', color: '#000000', settingsId: settings2.id },
      { name: 'Amarelo', color: '#FFD700', settingsId: settings2.id },
      { name: 'Laranja', color: '#FF8C00', settingsId: settings2.id },
    ],
  });

  console.log('Vests created.');

  // ──────────────────────────────────────────────
  // 9. Seasons (1 per group)
  // ──────────────────────────────────────────────
  const season1 = await prisma.season.create({
    data: {
      year: 2026,
      startDate: new Date('2026-03-01'),
      groupId: group1.id,
    },
  });

  const season2 = await prisma.season.create({
    data: {
      year: 2026,
      startDate: new Date('2026-03-15'),
      groupId: group2.id,
    },
  });

  console.log('Seasons created.');

  // ──────────────────────────────────────────────
  // 10. Sessions (1 per group)
  // ──────────────────────────────────────────────
  const session1 = await prisma.session.create({
    data: {
      seasonId: season1.id,
      groupId: group1.id,
      durationMinutes: 90,
      matchDurationMinutes: 10,
      totalMatches: 6,
      status: 'PENDING',
    },
  });

  const session2 = await prisma.session.create({
    data: {
      seasonId: season2.id,
      groupId: group2.id,
      durationMinutes: 60,
      matchDurationMinutes: 8,
      totalMatches: 4,
      status: 'PENDING',
    },
  });

  console.log('Sessions created.');

  // ──────────────────────────────────────────────
  // Summary
  // ──────────────────────────────────────────────
  console.log('\n--- Seed complete ---');
  console.log(`Users: 3`);
  console.log(`Groups: 2 (${group1.name}, ${group2.name})`);
  console.log(
    `Players: 7 in group1, 5 in group2 (12 total, with independent ELO)`,
  );
  console.log(`GroupMembers: 5 (3 in group1, 2 in group2)`);
  console.log(`Settings: 2 (group1: 4x5, group2: 3x4)`);
  console.log(`Vests: 4 in group1, 3 in group2`);
  console.log(`Seasons: 2 | Sessions: 2`);
  console.log(
    `\nLogin credentials (all users): password = "12345678"`,
  );
  console.log(`  marcos@teste.com  — DONO of both groups`);
  console.log(`  rafael@teste.com  — ADMIN of group1, JOGADOR of group2`);
  console.log(`  fernanda@teste.com — JOGADOR of group1 only`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
