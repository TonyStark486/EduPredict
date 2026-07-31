const pool = require('../db');

// Get all departments for a college
const getDepartments = async (req, res) => {
  try {
    const { collegeCode } = req.params;
    
    const result = await pool.query(
      'SELECT id, name, code, head_of_department, created_at FROM departments WHERE college_code = $1 ORDER BY name',
      [collegeCode]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching departments:', err);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

// Add new department
const addDepartment = async (req, res) => {
  try {
    const { collegeCode } = req.params;
    const { name, code, head_of_department } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({ error: 'Department name and code are required' });
    }
    
    const result = await pool.query(
      `INSERT INTO departments (college_code, name, code, head_of_department) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [collegeCode, name, code, head_of_department || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding department:', err);
    if (err.code === '23505') {
      res.status(400).json({ error: 'Department code already exists' });
    } else {
      res.status(500).json({ error: 'Failed to add department' });
    }
  }
};

// Update department
const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, head_of_department, status } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    const result = await pool.query(
      `UPDATE departments 
       SET name = $1, head_of_department = $2, status = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [name, head_of_department || null, status || 'active', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating department:', err);
    res.status(500).json({ error: 'Failed to update department' });
  }
};

// Delete department
const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if department has students
    const hasStudents = await pool.query(
      'SELECT COUNT(*) FROM students WHERE department_code = $1',
      [id]
    );

    if (parseInt(hasStudents.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete department with assigned students' 
      });
    }

    // Check if department has teachers
    const hasTeachers = await pool.query(
      'SELECT COUNT(*) FROM teachers WHERE department_id = $1',
      [id]
    );

    if (parseInt(hasTeachers.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete department with assigned teachers' 
      });
    }

    const result = await pool.query(
      'DELETE FROM departments WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    console.error('Error deleting department:', err);
    res.status(500).json({ error: 'Failed to delete department' });
  }
};

// Get students by department
const getStudents = async (req, res) => {
  const departmentCode = parseInt(req.params.departmentCode);
  const year = req.query.year;

  try {
    let query = 'SELECT * FROM students WHERE department_code = $1';
    let params = [departmentCode];

    if (year) {
      query += ' AND year = $2';
      params.push(year);
    }

    const result = await pool.query(query, params);

    const deptResult = await pool.query(
      'SELECT name FROM departments WHERE code = $1',
      [departmentCode]
    );
    const departmentName = deptResult.rows[0]?.name || '';

    res.json({
      students: result.rows,
      department_name: departmentName,
    });
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

// Get yearly summary
const getYearlySummary = async (req, res) => {
  const departmentCode = parseInt(req.params.departmentCode);
  try {
    const result = await pool.query(
      `SELECT year, 
         COUNT(*) AS total,
         SUM(CASE WHEN alert_status = 0 THEN 1 ELSE 0 END) AS saved,
         SUM(CASE WHEN alert_status = 1 THEN 1 ELSE 0 END) AS risk
       FROM students 
       WHERE department_code = $1
       GROUP BY year
       ORDER BY year ASC`,
      [departmentCode]
    );
    res.json({ years: result.rows });
  } catch (err) {
    console.error('Year summary error:', err);
    res.status(500).json({ error: 'Failed to fetch year summary' });
  }
};

module.exports = {
  getDepartments,
  addDepartment,
  updateDepartment,
  deleteDepartment,
  getStudents,
  getYearlySummary
};