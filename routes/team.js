const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '..', 'data.json'); // Adjust the path if needed

const readData = () => {
    if (!fs.existsSync(dataFilePath)) {
        const initialData = { teams: [] };
        fs.writeFileSync(dataFilePath, JSON.stringify(initialData, null, 2));  //JavaScript object or value to a JSON string
    }
    return JSON.parse(fs.readFileSync(dataFilePath, 'utf8')); //JSON String to JS obj
};

const writeData = (data) => {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
};

const getAllTeams = (req, res) => {
    console.log('Received GET request for all teams');
    const data = readData();
    res.json(data.teams || []);
};

const createNewTeam = (req, res) => {
    console.log('Received POST request to create a new team:', req.body);
    const { teamname, members } = req.body;
    const trimmedTeamname = (teamname || '').trim();
    
    console.log("teamname", trimmedTeamname);

    if (!trimmedTeamname || !members || !Array.isArray(members) || members.length === 0) {
        return res.status(400).json({
            error: true,
            message: "All fields are required and members must be a non-empty array of strings",
            missingFields: {
                teamname: !trimmedTeamname ? "Team name is required" : undefined,
                members: !members || !Array.isArray(members) || members.length === 0 ? "Members are required and must be a non-empty array" : undefined
            }
        });
    }
    

    const invalidMembers = members.filter(member => typeof member !== 'string' || !member.trim());
    if (invalidMembers.length > 0) {
        return res.status(400).json({
            error: true,
            message: "All members must be non-empty strings",
            invalidMembers
        });
    }

    const data = readData();
    const existingTeam = data.teams.find(team => team.teamname.toLowerCase() === trimmedTeamname.toLowerCase());
    if (existingTeam) {
        return res.status(400).json({
            error: true,
            message: "A team with this title already exists",
            duplicateTitle: trimmedTeamname
        });
    }

    const newTeam = {
        id: (data.teams.length > 0 ? data.teams[data.teams.length - 1].id + 1 : 1),
        teamname: trimmedTeamname,
        members: members.map(member => member.trim())
    };

    data.teams.push(newTeam);
    writeData(data);

    return res.status(201).json({
        error: false,
        message: "Team created successfully",
        team: newTeam
    });
};

const updateTeam = (req, res) => {
    const data = readData();
    const team = data.teams.find(tm => tm.id === parseInt(req.params.id));

    if (!team) {
        return res.status(404).json({
            error: true,
            message: `Team with ID ${req.params.id} not found`
        });
    }

    const { teamname, members } = req.body;
    const trimmedTeamname = (teamname || '').trim();

    if (teamname && !trimmedTeamname) {
        return res.status(400).json({
            error: true,
            message: "Team name cannot be empty"
        });
    }

    if (members && (!Array.isArray(members) || members.length === 0)) {
        return res.status(400).json({
            error: true,
            message: "Members must be a non-empty array of strings"
        });
    }

    const invalidMembers = members ? members.filter(member => typeof member !== 'string' || !member.trim()) : [];
    if (invalidMembers.length > 0) {
        return res.status(400).json({
            error: true,
            message: "All members must be non-empty strings",
            invalidMembers
        });
    }

    if (teamname) team.teamname = trimmedTeamname;
    if (members) team.members = members.map(member => member.trim());

    const filteredArray = data.teams.filter(t => t.id !== parseInt(req.params.id));
    data.teams = [...filteredArray, team].sort((a, b) => a.id - b.id);
    writeData(data);

    return res.json({
        error: false,
        message: "Team updated successfully",
        team: team
    });
};

const deleteTeam = (req, res) => {
    const data = readData();
    const team = data.teams.find(tm => tm.id === parseInt(req.params.id));

    if (!team) {
        return res.status(404).json({
            error: true,
            message: `Team with ID ${req.params.id} not found`
        });
    }

    data.teams = data.teams.filter(tm => tm.id !== parseInt(req.params.id));
    writeData(data);

    return res.json({
        error: false,
        message: `Team with ID ${req.params.id} deleted successfully`
    });
};

const getTeam = (req, res) => {
    const data = readData();
    const team = data.teams.find(tm => tm.id === parseInt(req.params.id));

    if (!team) {
        return res.status(404).json({
            error: true,
            message: `Team with ID ${req.params.id} not found`
        });
    }

    return res.json(team);
};

// Define routes
router.get('/', getAllTeams);
router.post('/', createNewTeam);
router.get('/:id', getTeam);
router.put('/:id', updateTeam);
router.delete('/:id', deleteTeam);

module.exports = router;
