export const eventDefaultValues = {
  title: '',
  description: '',
  location: '',
  imageUrl: '',
  startDateTime: new Date(),
  endDateTime: new Date(),
  categoryId: '',
  url: '',
  postedBy: 'organizer' as 'admin' | 'organizer',
  organizerInfo: {
    name: '',
    email: '',
    instagram: '',
    linkedin: '',
  },
}