const Event = require('../models/Event');
const asyncHandler = require('../middleware/asyncHandler');

const listEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({}).sort({ date: 1 });
  return res.json(events);
});

const addEvent = asyncHandler(async (req, res) => {
  const event = await Event.create({
    title: req.body.title,
    description: req.body.description,
    date: req.body.date,
    location: req.body.location,
    organizer: req.body.organizer,
    contactPhone: req.body.contactPhone,
    createdBy: req.userDb ? req.userDb._id : null
  });
  return res.status(201).json(event);
});

const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });

  Object.assign(event, req.body);
  await event.save();
  return res.json(event);
});

const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });

  await event.deleteOne();
  return res.json({ message: 'Event removed' });
});

module.exports = { listEvents, addEvent, updateEvent, deleteEvent };
