import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/pool.js';
import { goalModel } from '../models/goalModel.js';
import { familyModel } from '../models/familyModel.js';
import { familyService } from './familyService.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

export const goalService = {
  async listGoals(familyId, userId) {
    await familyService.verifyMembership(familyId, userId);
    const goals = await goalModel.findByFamilyId(null, familyId);
    return goals.map((g) => ({
      id: g.id,
      familyId: g.family_id,
      name: g.name,
      targetAmount: Number(g.target_amount),
      progressAmount: Number(g.progress_amount),
      currency: g.currency,
      createdAt: g.created_at,
    }));
  },

  async createGoal(familyId, userId, payload) {
    const member = await familyService.verifyMembership(familyId, userId);

    const id = uuidv4();
    const now = new Date();
    const created = await goalModel.create(null, {
      id,
      familyId,
      name: payload.name,
      targetAmount: payload.targetAmount,
      currency: payload.currency || 'INR',
      createdAt: now,
    });

    await familyModel.recordActivity(null, {
      id: uuidv4(),
      familyId,
      memberId: member.id,
      activityType: 'GOAL_CREATED',
      message: `Goal created: ${payload.name}`,
    });

    return {
      id: created.id,
      familyId: created.family_id,
      name: created.name,
      targetAmount: Number(created.target_amount),
      progressAmount: Number(created.progress_amount),
      currency: created.currency,
      createdAt: created.created_at,
    };
  },

  async contributeToGoal(familyId, goalId, userId, payload) {
    const activeMember = await familyService.verifyMembership(familyId, userId);

    const goal = await goalModel.findById(null, goalId);
    if (!goal) {
      throw new NotFoundError('Goal not found');
    }
    if (goal.family_id !== familyId) {
      throw new BadRequestError('Goal does not belong to this family');
    }

    const member = await familyModel.findMemberById(null, payload.memberId);
    if (!member) {
      throw new NotFoundError('Member not found');
    }
    if (member.family_id !== familyId) {
      throw new BadRequestError('Member does not belong to this family');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const now = new Date();
      await goalModel.addContribution(client, {
        id: uuidv4(),
        goalId,
        memberId: payload.memberId,
        amount: payload.amount,
        note: payload.note || null,
        contributedAt: now,
      });

      const updatedGoal = await goalModel.updateProgressAmount(client, goalId, payload.amount, now);

      await familyModel.recordActivity(client, {
        id: uuidv4(),
        familyId,
        memberId: member.id,
        activityType: 'GOAL_CONTRIBUTION',
        message: `${goal.name} received ₹${payload.amount}`,
      });

      await client.query('COMMIT');

      return {
        id: updatedGoal.id,
        familyId: updatedGoal.family_id,
        name: updatedGoal.name,
        targetAmount: Number(updatedGoal.target_amount),
        progressAmount: Number(updatedGoal.progress_amount),
        currency: updatedGoal.currency,
        createdAt: updatedGoal.created_at,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async updateGoal(familyId, goalId, userId, payload) {
    const member = await familyService.verifyMembership(familyId, userId);

    const goal = await goalModel.findById(null, goalId);
    if (!goal) {
      throw new NotFoundError('Goal not found');
    }
    if (goal.family_id !== familyId) {
      throw new BadRequestError('Goal does not belong to this family');
    }

    const now = new Date();
    const updated = await goalModel.update(null, goalId, {
      name: payload.name ?? goal.name,
      targetAmount: payload.targetAmount ?? goal.target_amount,
      currency: payload.currency ?? goal.currency,
      progressAmount: payload.progressAmount ?? goal.progress_amount,
      updatedAt: now,
    });

    await familyModel.recordActivity(null, {
      id: uuidv4(),
      familyId,
      memberId: member.id,
      activityType: 'GOAL_UPDATED',
      message: `Goal updated: ${updated.name}`,
    });

    return {
      id: updated.id,
      familyId: updated.family_id,
      name: updated.name,
      targetAmount: Number(updated.target_amount),
      progressAmount: Number(updated.progress_amount),
      currency: updated.currency,
      createdAt: updated.created_at,
    };
  },

  async deleteGoal(familyId, goalId, userId) {
    const member = await familyService.verifyMembership(familyId, userId);

    const goal = await goalModel.findById(null, goalId);
    if (!goal) {
      throw new NotFoundError('Goal not found');
    }
    if (goal.family_id !== familyId) {
      throw new BadRequestError('Goal does not belong to this family');
    }

    await goalModel.delete(null, goalId);

    await familyModel.recordActivity(null, {
      id: uuidv4(),
      familyId,
      memberId: member.id,
      activityType: 'GOAL_DELETED',
      message: `Goal deleted: ${goal.name}`,
    });

    return { success: true };
  }
};
