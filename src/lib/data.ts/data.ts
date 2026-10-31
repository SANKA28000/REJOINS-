export type EventItem = {
  id: string;
  icon: string;
  title: string;
  category: string;
  people: string;
  time: string;
  distance: string;
  pmr: boolean;
  place: string;
  description: string;
  creator_id?: string;
  joined?: boolean;
};

export const companions = [
  {
    id: '1',
    name: 'Camille',
    meta: 'Accompagnement de sorties',
    tags: ['Balade', 'Discussion', 'PMR'],
  },
  {
    id: '2',
    name: 'Alex',
    meta: 'Aide aux courses et déplacements',
    tags: ['Courses', 'Accompagnement'],
  },
  {
    id: '3',
    name: 'Marie',
    meta: 'Rencontres et activités de quartier',
    tags: ['Café', 'Jeux', 'Sorties'],
  },
];
