const express = require('express');
const routerticket = express.Router();
const fs = require('fs');
const path = require('path');

// Path to the data file
const dataFilePath = path.join(__dirname, '..', 'data.json');

const readData = () => {
    if (!fs.existsSync(dataFilePath)) {
        const initialData = { tickets: [] };
        fs.writeFileSync(dataFilePath, JSON.stringify(initialData, null, 2));
    }
    return JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
};


const writeData = (data) => {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
};


// Controller functions
const getAllTickets = (req, res) => {
    console.log('Received GET request for all tickets');
    const data = readData();
    res.json(data.tickets || []);
};

const createNewTicket = (req, res) => {
    console.log('Received POST request to create a new ticket:', req.body);
    const { title, description, team, status, assignee, reporter } = req.body;

    // Trim whitespace
    const trimmedTitle = (title || '').trim();
    const trimmedDescription = (description || '').trim();
    const trimmedTeam = (team || '').trim();
    const trimmedStatus = (status || '').trim().toLowerCase();
    const trimmedAssignee = (assignee || '').trim();
    const trimmedReporter = (reporter || '').trim();

    // Validate trimmed fields
    if (!trimmedTitle || !trimmedDescription || !trimmedTeam || !trimmedStatus || !trimmedAssignee || !trimmedReporter) {
        return res.status(400).json({
            error: true,
            message: "All fields are required",
            missingFields: {
                title: !trimmedTitle ? "Title is required" : undefined,
                description: !trimmedDescription ? "Description is required" : undefined,
                team: !trimmedTeam ? "Team is required" : undefined,
                status: !trimmedStatus ? "Status is required" : undefined,
                assignee: !trimmedAssignee ? "Assignee is required" : undefined,
                reporter: !trimmedReporter ? "Reporter is required" : undefined,
            }
        });
    }

    // Validate status
    const validStatuses = ['open', 'in-progress', 'resolved', 'closed'];
    if (!validStatuses.includes(trimmedStatus)) {
        return res.status(400).json({
            error: true,
            message: "Invalid status value",
            invalidStatus: trimmedStatus
        });
    }

    // Create a new ticket object
    const data = readData();
    const newTicket = {
        id: data.tickets.length > 0 ? data.tickets[data.tickets.length - 1].id + 1 : 1,
        title: trimmedTitle,
        description: trimmedDescription,
        team: trimmedTeam,
        status: trimmedStatus,
        assignee: trimmedAssignee,
        reporter: trimmedReporter
    };

    // Add the new ticket to the data
    data.tickets.push(newTicket);
    writeData(data);

    res.status(201).json({
        error: false,
        message: "Ticket created successfully",
        ticket: newTicket
    });
};

const updateTicket = (req, res) => {
    const { id } = req.params;
    const { title, description, team, status, assignee, reporter } = req.body;

    // Find the ticket to update
    const data = readData();
    const ticket = data.tickets.find(tic => tic.id === parseInt(id));

    if (!ticket) {
        return res.status(404).json({
            error: true,
            message: `Ticket with ID ${id} not found`
        });
    }

    // Update ticket fields with trimming and validation
    const updatedTicket = {
        ...ticket,
        title: title ? title.trim() : ticket.title,
        description: description ? description.trim() : ticket.description,
        team: team ? team.trim() : ticket.team,
        status: status ? status.trim().toLowerCase() : ticket.status,
        assignee: assignee ? assignee.trim() : ticket.assignee,
        reporter: reporter ? reporter.trim() : ticket.reporter
    };

    // Validate updated status
    const validStatuses = ['open', 'in-progress', 'resolved', 'closed'];
    if (!validStatuses.includes(updatedTicket.status)) {
        return res.status(400).json({
            error: true,
            message: "Invalid status value",
            invalidStatus: updatedTicket.status
        });
    }

    // Save the updated ticket
    data.tickets = data.tickets.map(tic => tic.id === parseInt(id) ? updatedTicket : tic).sort((a, b) => a.id - b.id);
    writeData(data);

    res.json({
        error: false,
        message: "Ticket updated successfully",
        ticket: updatedTicket
    });
};

const deleteTicket = (req, res) => {
    const { id } = req.params;
    const data = readData();
    const ticketIndex = data.tickets.findIndex(tic => tic.id === parseInt(id));

    if (ticketIndex === -1) {
        return res.status(404).json({
            error: true,
            message: `Ticket with ID ${id} not found`
        });
    }

    // Remove the ticket
    data.tickets.splice(ticketIndex, 1);
    writeData(data);

    res.json({
        error: false,
        message: `Ticket with ID ${id} deleted successfully`
    });
};

const getTicket = (req, res) => {
    const { id } = req.params;
    const data = readData();
    const ticket = data.tickets.find(tic => tic.id === parseInt(id));

    if (!ticket) {
        return res.status(404).json({
            error: true,
            message: `Ticket with ID ${id} not found`
        });
    }

    res.json(ticket);
};

// Define the routes
routerticket.get('/', getAllTickets);
routerticket.post('/', createNewTicket);
routerticket.get('/:id', getTicket);
routerticket.put('/:id', updateTicket);
routerticket.delete('/:id', deleteTicket);

module.exports = routerticket;
