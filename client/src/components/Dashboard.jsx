import React, { useState, useEffect, useCallback } from 'react';
import { generateDietPlan, generateWeeklyWorkoutPlan, swapMeal } from '../services/backendService';
import { ArrowRight, ArrowUpRight, Calendar, Check, ChevronLeft, ChevronRight, Dumbbell, Flame, LayoutDashboard, Loader2, LogOut, MessageCircle, Plus, Settings, Target, TrendingUp, Scale, Utensils, X } from 'lucide-react';
import { Brand, Button, CoachMark, IconButton, SectionHeading, Tag, TextLink } from './ui';
import ChatCoach from './ChatCoach';
import ProfileOverview from './ProfileOverview';
import Progress from './Progress';
import WeightCheckIn from './WeightCheckIn';
import useProgress from '../hooks/useProgress';
import useNutritionProfile from '../hooks/useNutritionProfile';
import { planMealSlots } from '../contracts/nutrition.js';
import { dayKey, addDays, dateForSection, checkInDue, displayDate, activityStreak } from '../utils/progressData';
import { retainLoggedMeals } from '../utils/mealPlanReplacement';
import DietCard, { AddMealModal } from './DietCard';
import WorkoutCard, { AddWorkoutModal } from './WorkoutCard';
const getEstimatedBurn = ex => {
  if (ex.estimatedCaloriesBurned) return ex.estimatedCaloriesBurned;
  if (ex.estimatedCalories) return ex.estimatedCalories;
  const duration = ex.durationMinutes ?? 5;
  let perMin = 6;
  if (ex.notes?.toLowerCase().includes('intense')) perMin = 10;else if (ex.notes?.toLowerCase().includes('light')) perMin = 4;
  return Math.round(duration * perMin);
};
const computeBurnedToday = (workoutPlan, manualWorkouts, completedIds) => {
  const idSet = new Set(completedIds);
  let total = 0;
  if (workoutPlan?.exercises) {
    workoutPlan.exercises.forEach(ex => {
      if (idSet.has(ex.id)) {
        total += getEstimatedBurn(ex);
      }
    });
  }
  manualWorkouts.forEach(mw => {
    if (idSet.has(mw.id)) {
      total += getEstimatedBurn(mw);
    }
  });
  return total;
};
const Dashboard = ({
  user,
  onLogout,
  onEditProfile,
  onViewProfile,
  onSectionChange,
  initialSection = 'overview',
  progressApi,
  nutritionApi,
  onNutritionProfileUpdated
}) => {
  const [activeModal, setActiveModal] = useState(null);
  const [notice, setNotice] = useState('');
  const [swappingMealId, setSwappingMealId] = useState(null);
  const [activeSection, setActiveSection] = useState(initialSection);
  const todayStr = dayKey();
  const [trainingDate, setTrainingDate] = useState(todayStr);
  const [historyDate, setHistoryDate] = useState(todayStr);
  const [progressTab, setProgressTab] = useState('trends');
  const [checkInDate, setCheckInDate] = useState(null);
  const selectedDate = dateForSection(activeSection, trainingDate, todayStr);
  const progress = useProgress(user.uid, progressApi);
  const latestMeasurement = progress.entries.filter(entry => entry.status === 'measured').sort((a, b) => b.date.localeCompare(a.date))[0];
  const nutrition = useNutritionProfile(user, latestMeasurement, !progress.loading, onNutritionProfileUpdated, nutritionApi);
  const nutritionUser = nutrition.profile;
  const todayCheckIn = progress.entries.find(entry => entry.date === todayStr);
  const checkInIsDue = checkInDue(progress.entries, progress.frequency, todayStr);
  useEffect(() => { setActiveSection(initialSection); }, [initialSection]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [activeSection]);
  const changeSection = section => {
    setActiveSection(section);
    onSectionChange?.(section);
  };
  const viewProfile = () => onViewProfile ? onViewProfile() : changeSection('profile');
  const [dietHistory, setDietHistory] = useState({});
  const [workoutHistory, setWorkoutHistory] = useState({});
  const [trackingHistory, setTrackingHistory] = useState({});
  const [manualMealsHistory, setManualMealsHistory] = useState({});
  const [manualWorkoutsHistory, setManualWorkoutsHistory] = useState({});
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingDiet, setLoadingDiet] = useState(false);
  const [loadingWorkout, setLoadingWorkout] = useState(false);
  const getDietKey = date => `aiCoachDiet_${user.uid}_${date}`;
  const getWorkoutKey = date => `aiCoachWorkout_${user.uid}_${date}`;
  const getTrackingKey = date => `aiCoachTracking_${user.uid}_${date}`;
  const getManualMealsKey = date => `aiCoachManualMeals_${user.uid}_${date}`;
  const getManualWorkoutsKey = date => `aiCoachManualWorkouts_${user.uid}_${date}`;
  const getChatKey = () => `aiCoachChat_${user.uid}`;
  const isToday = selectedDate === todayStr;
  const isPast = selectedDate < todayStr;
  const isFuture = selectedDate > todayStr;
  const initTrackingIfMissing = (date, targetCalories) => {
    const key = getTrackingKey(date);
    const saved = localStorage.getItem(key);
    if (saved) {
      setTrackingHistory(prev => ({
        ...prev,
        [date]: JSON.parse(saved)
      }));
    } else {
      const newTracking = {
        date: date,
        completedMealIds: [],
        completedExerciseIds: [],
        totalTargetCalories: targetCalories,
        totalEstimatedCaloriesConsumed: 0,
        totalEstimatedCaloriesBurned: 0,
        calorieDeficit: 0,
        netCalories: 0
      };
      localStorage.setItem(key, JSON.stringify(newTracking));
      setTrackingHistory(prev => ({
        ...prev,
        [date]: newTracking
      }));
    }
  };
  const handleGenerateDiet = useCallback(async (force = false) => {
    if (!isToday) return;
    const dietKey = getDietKey(selectedDate);
    const existing = localStorage.getItem(dietKey);
    if (existing && force !== true) {
      const parsedPlan = JSON.parse(existing);
      setDietHistory(prev => ({
        ...prev,
        [selectedDate]: parsedPlan
      }));
      initTrackingIfMissing(selectedDate, parsedPlan.totalCalories);
      return;
    }
    setNotice('');
    setLoadingDiet(true);
    try {
      const plan = await generateDietPlan();
      const planWithDate = {
        ...plan,
        date: selectedDate
      };
      // Keep already eaten meals in the journal when replacing a saved plan.
      const previousTracking = JSON.parse(localStorage.getItem(getTrackingKey(selectedDate)) || 'null');
      if (force === true && previousTracking) {
        const previousPlan = JSON.parse(existing || 'null');
        const journal = JSON.parse(localStorage.getItem(getManualMealsKey(selectedDate)) || '[]');
        const replacement = retainLoggedMeals(previousPlan, journal, previousTracking, plan);
        localStorage.setItem(getManualMealsKey(selectedDate), JSON.stringify(replacement.journal));
        setManualMealsHistory(prev => ({ ...prev, [selectedDate]: replacement.journal }));
        localStorage.setItem(getTrackingKey(selectedDate), JSON.stringify(replacement.tracking));
      }
      localStorage.setItem(dietKey, JSON.stringify(planWithDate));
      setDietHistory(prev => ({
        ...prev,
        [selectedDate]: planWithDate
      }));
      initTrackingIfMissing(selectedDate, plan.totalCalories);
      void nutrition.refresh();
    } catch (error) {
      console.error(error);
      setNotice(error.response?.data?.error || 'Your meal plan couldn’t be created. Check your connection and try again.');
    } finally {
      setLoadingDiet(false);
    }
  }, [selectedDate, user, isToday]);
  const handleGenerateWorkout = useCallback(async () => {
    if (!isToday) return;
    const workoutKey = getWorkoutKey(selectedDate);
    const existing = localStorage.getItem(workoutKey);
    if (existing) {
      setWorkoutHistory(prev => ({
        ...prev,
        [selectedDate]: JSON.parse(existing)
      }));
      return;
    }
    setNotice('');
    setLoadingWorkout(true);
    try {
      const weekPlans = await generateWeeklyWorkoutPlan(selectedDate);
      const startDate = new Date(selectedDate);
      weekPlans.forEach((dayPlan, index) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + index);
        const dateStr = d.toISOString().split('T')[0];
        const planWithDate = {
          ...dayPlan,
          date: dateStr
        };
        const key = getWorkoutKey(dateStr);
        localStorage.setItem(key, JSON.stringify(planWithDate));
        if (dateStr === selectedDate) {
          setWorkoutHistory(prev => ({
            ...prev,
            [dateStr]: planWithDate
          }));
        }
      });
    } catch (error) {
      console.error(error);
      setNotice('Your workout plan couldn’t be created. Check your connection and try again.');
    } finally {
      setLoadingWorkout(false);
    }
  }, [selectedDate, user, isToday]);
  const updateChatHistory = newMessages => {
    setChatHistory(newMessages);
    localStorage.setItem(getChatKey(), JSON.stringify(newMessages));
  };
  useEffect(() => {
    const loadAndSync = async () => {
      const mmKey = getManualMealsKey(selectedDate);
      const mwKey = getManualWorkoutsKey(selectedDate);
      const savedMM = localStorage.getItem(mmKey);
      const savedMW = localStorage.getItem(mwKey);
      if (savedMM) setManualMealsHistory(prev => ({
        ...prev,
        [selectedDate]: JSON.parse(savedMM)
      }));
      if (savedMW) setManualWorkoutsHistory(prev => ({
        ...prev,
        [selectedDate]: JSON.parse(savedMW)
      }));
      const dietKey = getDietKey(selectedDate);
      const savedDiet = localStorage.getItem(dietKey);
      let dietLoaded = false;
      if (savedDiet) {
        const parsedDiet = JSON.parse(savedDiet);
        setDietHistory(prev => ({
          ...prev,
          [selectedDate]: parsedDiet
        }));
        dietLoaded = true;
        initTrackingIfMissing(selectedDate, parsedDiet.totalCalories);
      }
      const workoutKey = getWorkoutKey(selectedDate);
      const savedWorkout = localStorage.getItem(workoutKey);
      let workoutLoaded = false;
      if (savedWorkout) {
        setWorkoutHistory(prev => ({
          ...prev,
          [selectedDate]: JSON.parse(savedWorkout)
        }));
        workoutLoaded = true;
      }
      const trackKey = getTrackingKey(selectedDate);
      const savedTrack = localStorage.getItem(trackKey);
      if (savedTrack) {
        setTrackingHistory(prev => ({
          ...prev,
          [selectedDate]: JSON.parse(savedTrack)
        }));
      }
      if (chatHistory.length === 0) {
        const savedChat = localStorage.getItem(getChatKey());
        if (savedChat) {
          setChatHistory(JSON.parse(savedChat));
        } else {
          const initialMsg = {
            role: 'model',
            text: `Hi ${user.name}! How can I help you today?`,
            timestamp: Date.now()
          };
          setChatHistory([initialMsg]);
        }
      }
      if (isToday && ['overview', 'meals', 'workout'].includes(activeSection)) {
        if (!dietLoaded && !savedDiet && !loadingDiet) {
          handleGenerateDiet();
        }
        if (!workoutLoaded && !savedWorkout && !loadingWorkout) {
          handleGenerateWorkout();
        }
      }
    };
    loadAndSync();
  }, [selectedDate, user.uid, activeSection]);
  const currentDietPlan = dietHistory[selectedDate] || null;
  const currentWorkoutPlan = workoutHistory[selectedDate] || null;
  const currentManualMeals = manualMealsHistory[selectedDate] || [];
  const currentManualWorkouts = manualWorkoutsHistory[selectedDate] || [];
  const currentTracking = trackingHistory[selectedDate] || {
    date: selectedDate,
    completedMealIds: [],
    completedExerciseIds: [],
    totalTargetCalories: currentDietPlan?.totalCalories || 0,
    totalEstimatedCaloriesConsumed: 0,
    totalEstimatedCaloriesBurned: 0,
    calorieDeficit: 0,
    netCalories: 0
  };
  const saveTracking = tracking => {
    setTrackingHistory(prev => ({
      ...prev,
      [selectedDate]: tracking
    }));
    localStorage.setItem(getTrackingKey(selectedDate), JSON.stringify(tracking));
  };
  const handleSwapMeal = async mealId => {
    const mealToSwap = currentDietPlan?.meals.find(m => m.id === mealId);
    if (!mealToSwap || !currentDietPlan) return;
    setNotice('');
    setSwappingMealId(mealId);
    try {
      const newMeal = await swapMeal(mealToSwap, currentDietPlan);
      const updatedMeals = currentDietPlan.meals.map(m => m.id === mealId ? newMeal : m);
      const updatedPlan = {
        ...currentDietPlan,
        meals: updatedMeals,
        totalCalories: updatedMeals.reduce((sum, meal) => sum + Number(meal.calories || 0), 0)
      };
      saveTracking({ ...currentTracking, totalTargetCalories: updatedPlan.totalCalories, calorieDeficit: updatedPlan.totalCalories - currentTracking.totalEstimatedCaloriesConsumed });
      localStorage.setItem(getDietKey(selectedDate), JSON.stringify(updatedPlan));
      setDietHistory(prev => ({
        ...prev,
        [selectedDate]: updatedPlan
      }));
    } catch (error) {
      console.error(error);
      setNotice(error.response?.data?.error || 'We couldn’t find a meal swap just now. Please try again.');
    } finally {
      setSwappingMealId(null);
    }
  };
  const toggleMeal = (mealId, calories) => {
    const isCompleted = currentTracking.completedMealIds.includes(mealId);
    const newIds = isCompleted ? currentTracking.completedMealIds.filter(id => id !== mealId) : [...currentTracking.completedMealIds, mealId];
    const newConsumed = isCompleted ? currentTracking.totalEstimatedCaloriesConsumed - calories : currentTracking.totalEstimatedCaloriesConsumed + calories;
    const burned = currentTracking.totalEstimatedCaloriesBurned;
    const target = currentTracking.totalTargetCalories || 0;
    const updatedTracking = {
      ...currentTracking,
      completedMealIds: newIds,
      totalEstimatedCaloriesConsumed: newConsumed,
      calorieDeficit: target - newConsumed,
      netCalories: newConsumed - burned
    };
    saveTracking(updatedTracking);
  };
  const addManualMeal = meal => {
    const updatedManuals = [...currentManualMeals, meal];
    setManualMealsHistory(prev => ({
      ...prev,
      [selectedDate]: updatedManuals
    }));
    localStorage.setItem(getManualMealsKey(selectedDate), JSON.stringify(updatedManuals));
    toggleMeal(meal.id, meal.calories);
    setActiveModal(null);
  };
  const toggleExercise = exerciseId => {
    const isCompleted = currentTracking.completedExerciseIds.includes(exerciseId);
    const newIds = isCompleted ? currentTracking.completedExerciseIds.filter(id => id !== exerciseId) : [...currentTracking.completedExerciseIds, exerciseId];
    const newBurned = computeBurnedToday(currentWorkoutPlan, currentManualWorkouts, newIds);
    const consumed = currentTracking.totalEstimatedCaloriesConsumed;
    const updatedTracking = {
      ...currentTracking,
      completedExerciseIds: newIds,
      totalEstimatedCaloriesBurned: newBurned,
      totalEstimatedCaloriesConsumed: consumed,
      calorieDeficit: (currentTracking.totalTargetCalories || 0) - consumed,
      netCalories: consumed - newBurned
    };
    saveTracking(updatedTracking);
  };
  const addManualWorkout = workout => {
    const updatedWorkouts = [...currentManualWorkouts, workout];
    setManualWorkoutsHistory(prev => ({
      ...prev,
      [selectedDate]: updatedWorkouts
    }));
    localStorage.setItem(getManualWorkoutsKey(selectedDate), JSON.stringify(updatedWorkouts));
    const completedExerciseIds = [...currentTracking.completedExerciseIds, workout.id];
    const burned = computeBurnedToday(currentWorkoutPlan, updatedWorkouts, completedExerciseIds);
    saveTracking({
      ...currentTracking,
      completedExerciseIds,
      totalEstimatedCaloriesBurned: burned,
      netCalories: currentTracking.totalEstimatedCaloriesConsumed - burned
    });
    setActiveModal(null);
  };
  const burnedToday = computeBurnedToday(currentWorkoutPlan, currentManualWorkouts, currentTracking.completedExerciseIds);
  const plannedBurnToday = (currentWorkoutPlan?.exercises || []).reduce((acc, ex) => acc + getEstimatedBurn(ex), 0);
  const currentNet = currentTracking.totalEstimatedCaloriesConsumed - burnedToday;
  const currentTarget = currentTracking.totalTargetCalories || 0;
  const eatenPercent = currentTarget > 0 ? Math.min(currentTracking.totalEstimatedCaloriesConsumed / currentTarget * 100, 100) : 0;
  const burnTarget = plannedBurnToday > 0 ? plannedBurnToday : 500;
  const burnPercent = Math.min(burnedToday / burnTarget * 100, 100);
  const getBadgeStats = () => {
    const streak = activityStreak(user.uid, todayStr);
    let mealsCount = 0;
    let activeMinutes = 0;
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const savedTrack = localStorage.getItem(getTrackingKey(dateStr));
      const track = savedTrack ? JSON.parse(savedTrack) : null;
      if (track) {
        mealsCount += track.completedMealIds.length;
        const savedManual = localStorage.getItem(getManualWorkoutsKey(dateStr));
        const manualWorkouts = savedManual ? JSON.parse(savedManual) : [];
        if (track.completedExerciseIds) {
          track.completedExerciseIds.forEach(id => {
            if (id.startsWith('manual_')) {
              const mw = manualWorkouts.find(m => m.id === id);
              if (mw) activeMinutes += mw.durationMinutes;
            } else {
              activeMinutes += 5;
            }
          });
        }
      }
    }
    return {
      streak,
      mealsCount,
      activeMinutes
    };
  };
  const badgeStats = getBadgeStats();
  const sections = [{
    id: 'overview',
    title: 'Overview',
    icon: LayoutDashboard
  }, {
    id: 'meals',
    title: 'Nutrition',
    icon: Utensils
  }, {
    id: 'workout',
    title: 'Training',
    icon: Dumbbell
  }, {
    id: 'progress',
    title: 'Progress',
    icon: TrendingUp
  }, {
    id: 'coach',
    title: 'Ask Guruji',
    icon: MessageCircle
  }];
  const title = activeSection === 'profile' ? 'My profile' : sections.find(section => section.id === activeSection)?.title;
  const firstName = user.name?.split(' ')[0] || 'friend';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const mealsDone = currentTracking.completedMealIds.length;
  const exercisesDone = currentTracking.completedExerciseIds.length;
  const plannedExercisesDone = currentWorkoutPlan?.exercises.filter(exercise => currentTracking.completedExerciseIds.includes(exercise.id)).length || 0;
  const planState = (kind, preview = false) => {
    const isDiet = kind === 'diet';
    const loading = isDiet ? loadingDiet : loadingWorkout;
    const plan = isDiet ? currentDietPlan : currentWorkoutPlan;
    const handler = isDiet ? handleGenerateDiet : handleGenerateWorkout;
    if (loading) return <div className="plan-empty" role="status">
  <Loader2 size={25} className="spin" />
  <h3>{isDiet ? 'A little inspiration is on its way.' : 'Finding your rhythm for the week.'}</h3>
  <p>{isDiet ? 'Putting together your meals and recipes…' : 'Preparing your workout sessions…'}</p>
</div>;
    if (!plan) return <div className="plan-empty">
  {isDiet ? <Utensils size={28} /> : <Dumbbell size={28} />}
  <h3>{isToday ? `Make room for ${isDiet ? 'good food' : 'movement'}.` : 'A fresh page in your routine.'}</h3>
  <p>{isToday ? `Your ${isDiet ? 'daily meals' : 'weekly workouts'}, ready when you are.` : isPast ? 'No plan was saved for this date.' : 'You can create a plan when this day arrives.'}</p>
  {isToday && <Button variant="secondary" onClick={handler}>Create {isDiet ? 'meal plan' : 'workout plan'} <ArrowUpRight size={16} /></Button>}
</div>;
    if (preview) return isDiet ? <div className="plan-preview">{[...planMealSlots(plan).slots, ...planMealSlots(plan).extras].filter(slot => slot.meal).map(slot => ({ ...slot.meal, label: slot.label, time: slot.time })).map(meal => <button className="preview-row" key={meal.id} onClick={() => changeSection('meals')}>
    <span className={`preview-status ${currentTracking.completedMealIds.includes(meal.id) ? 'done' : ''}`}>{currentTracking.completedMealIds.includes(meal.id) ? <Check size={15} /> : <Utensils size={15} />}</span>
    <span>
      <small>{meal.label || meal.type}{meal.time ? ` · ${meal.time}` : ''}</small>
      <strong>{meal.name}</strong>
    </span>
    <span className="preview-calories">
      {meal.calories}
      <small>kcal</small>
    </span>
    <ArrowUpRight size={15} />
  </button>)}</div> : <div className="workout-preview">
  <div className="preview-workout-title">
    <span className="workout-preview-icon"><Dumbbell size={30} /></span>
    <div>
      <h3>{plan.focus || plan.dayName || 'Your session'}</h3>
      <p>{plan.duration || 'At your pace'} · {plan.difficulty || 'Your level'}</p>
    </div>
  </div>
  <div className="workout-preview-bottom">
    <span>{plannedExercisesDone} of {plan.exercises.length} exercises done</span>
    <button className="text-link" onClick={() => changeSection('workout')}>View session <ArrowRight size={15} /></button>
  </div>
  <div className="thin-progress"><span style={{
          width: `${plan.exercises.length ? plannedExercisesDone / plan.exercises.length * 100 : 0}%`
        }} /></div>
</div>;
    return isDiet ? <DietCard plan={plan} manualMeals={currentManualMeals} completedMealIds={currentTracking.completedMealIds} onToggleMeal={toggleMeal} onAddManualMeal={addManualMeal} onSwapMeal={handleSwapMeal} swappingMealId={swappingMealId} onRegenerate={() => handleGenerateDiet(true)} canRegenerate={isToday} profile={nutritionUser} nutritionLoading={nutrition.loading} /> : <WorkoutCard plan={plan} manualWorkouts={currentManualWorkouts} completedExerciseIds={currentTracking.completedExerciseIds} onToggleExercise={toggleExercise} onAddManualWorkout={addManualWorkout} userWeight={latestMeasurement?.weightKg || user.weight} readOnly={!isToday} />;
  };
  return <div className="app-shell">
  <aside className="app-sidebar">
    <Brand />
    <div className="sidebar-label">YOUR DAILY SPACE</div>
    <nav className="sidebar-nav" aria-label="Dashboard navigation">{sections.map(({
          id,
          title,
          icon: Icon
        }) => <button key={id} className={activeSection === id ? 'active' : ''} aria-current={activeSection === id ? 'page' : undefined} onClick={() => changeSection(id)}>
        <Icon size={19} />
        <span>{title}</span>
        {id === 'coach' && <span className="nav-ai">AI</span>}
      </button>)}</nav>
    <div className="sidebar-coach">
      <CoachMark />
      <h3>A little guidance<br />goes a long way.</h3>
      <p>Questions are always welcome.</p>
      <TextLink onClick={() => changeSection('coach')}>Talk to Guruji</TextLink>
    </div>
    <div className="sidebar-bottom">
      <a className="sidebar-setting" href="/how-it-works"><ArrowUpRight size={18} /> How it works</a>
      <button className={`sidebar-setting ${activeSection === 'profile' ? 'active' : ''}`} aria-current={activeSection === 'profile' ? 'page' : undefined} onClick={viewProfile}><Settings size={18} /> My profile <ArrowUpRight size={15} /></button>
      <div className="sidebar-account">
        <button className="account-profile" onClick={viewProfile}>
          <span className="avatar">{firstName.charAt(0)}</span>
          <span>
            <strong>{user.name}</strong>
            <small>Your personal space</small>
          </span>
        </button>
        <IconButton label="Log out" onClick={onLogout}><LogOut size={17} /></IconButton>
      </div>
    </div>
  </aside>
  <div className="dashboard-main">
    <header className="dashboard-topbar">
      <div className="mobile-brand"><Brand /></div>
      <div className="breadcrumb">My space <span>/</span> <strong>{title}</strong></div>
      <div className="topbar-right">
        <span className="streak-pill"><Flame size={16} /><b>{badgeStats.streak}</b> day streak</span>
        <button className="avatar" onClick={viewProfile} aria-label="View your profile">{firstName.charAt(0)}</button>
        <IconButton label="Log out" className="mobile-logout" onClick={onLogout}><LogOut size={17} /></IconButton>
      </div>
    </header>
    <main className={`dashboard-body section-${activeSection}`}>
      {['meals', 'profile'].includes(activeSection) && nutrition.loading && <p className="nutrition-status" role="status">Checking your saved nutrition targets…</p>}
      {['meals', 'profile'].includes(activeSection) && nutrition.error && <div className="error-banner" role="alert">{nutrition.error} <button className="text-link" onClick={() => nutrition.refresh()}>Try again</button></div>}
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">{activeSection === 'progress' ? 'YOUR JOURNEY, AT YOUR PACE' : activeSection === 'profile' ? 'YOUR PERSONAL SPACE' : activeSection === 'overview' ? 'SMALL STEPS. REAL MOMENTUM.' : activeSection === 'meals' ? 'FUEL YOUR EVERYDAY' : activeSection === 'workout' ? 'MAKE TIME FOR MOVEMENT' : 'YOUR QUESTIONS. A LITTLE CLARITY.'}</p>
          <h1>{activeSection === 'progress' ? 'See how far you’ve come.' : activeSection === 'profile' ? 'A little about you.' : activeSection === 'overview' ? <>{greeting}, {firstName}<span className="accent">.</span></> : activeSection === 'meals' ? 'Good food. Your way.' : activeSection === 'workout' ? 'Find your strong.' : 'Let’s talk it through.'}</h1>
          <p>{activeSection === 'progress' ? 'Explore past days, follow your routine, and check in when it suits you.' : activeSection === 'profile' ? 'Your goals, preferences, and progress in one place.' : activeSection === 'overview' ? 'A new day. A little room for progress.' : activeSection === 'meals' ? 'Familiar flavors, thoughtful choices, and room to enjoy it all.' : activeSection === 'workout' ? 'Your session, your pace. Showing up is a good start.' : 'Quick follow-ups about your meals, workouts, and routine.'}</p>
        </div>
        {['meals', 'workout'].includes(activeSection) && <Tag><Calendar size={15} /> {isToday ? 'Today' : 'Upcoming'} · {displayDate(selectedDate)}</Tag>}
      </div>
      {notice && <div className="error-banner dashboard-notice" role="alert">
        <span>{notice}</span>
        <IconButton label="Dismiss message" onClick={() => setNotice('')}><X size={16} /></IconButton>
      </div>}
      {activeSection === 'overview' && <>
        <section className="today-hero">
          <div>
            <Tag><span className="live-dot" /> {user.goal || 'YOUR EVERYDAY'}</Tag>
            <h2>YOUR DAY.<br /><span>YOUR MOMENTUM.</span></h2>
            <p>Eat something good. Find a little movement.<br />Take the next step that works for you.</p>
            <div className="hero-actions">
              <Button onClick={() => setActiveModal('meal')}><Plus size={17} /> Log a meal</Button>
              <button className="text-link" onClick={() => changeSection('workout')}>See today’s workout <ArrowUpRight size={17} /></button>
            </div>
          </div>
          <div className="momentum-art" aria-hidden="true">
            <svg viewBox="0 0 300 250">
              <path d="M20 210 120 40h45L65 210Z" />
              <path d="M100 210 200 40h45L145 210Z" />
            </svg>
            <span>ONE DAY<br />AT A TIME.</span>
          </div>
        </section>
        <section className="stats-grid" aria-label="Daily progress">
          <article className="stat-card">
            <div className="stat-top">
              <span>ENERGY IN</span>
              <Utensils size={17} />
            </div>
            <strong>
              {currentTracking.totalEstimatedCaloriesConsumed.toLocaleString()}
              <small>kcal</small>
            </strong>
            <div className="thin-progress"><span style={{
                  width: `${eatenPercent}%`
                }} /></div>
            <p>{currentTarget ? `of ${currentTarget.toLocaleString()} kcal planned` : 'Your meals, one at a time'}</p>
          </article>
          <article className="stat-card">
            <div className="stat-top">
              <span>ENERGY OUT</span>
              <Flame size={17} />
            </div>
            <strong>
              {burnedToday.toLocaleString()}
              <small>kcal</small>
            </strong>
            <div className="thin-progress orange-progress"><span style={{
                  width: `${burnPercent}%`
                }} /></div>
            <p>Estimated from logged movement</p>
          </article>
          <article className="stat-card">
            <div className="stat-top">
              <span>NET ENERGY</span>
              <TrendingUp size={17} />
            </div>
            <strong>
              {currentNet.toLocaleString()}
              <small>kcal</small>
            </strong>
            <div className="stat-equation">FOOD IN <span>−</span> MOVEMENT OUT</div>
            <p>A snapshot of your day</p>
          </article>
          <article className="stat-card stat-completion">
            <div className="stat-top">
              <span>YOUR CHECKLIST</span>
              <Target size={17} />
            </div>
            <strong>
              {mealsDone + exercisesDone}
              <small>done</small>
            </strong>
            <div className="checklist-tags">
              <span><Utensils size={12} /> {mealsDone} meals</span>
              <span><Dumbbell size={12} /> {exercisesDone} exercises</span>
            </div>
            <p>The small wins add up</p>
          </article>
        </section>
        <div className="overview-grid">
          <section className="surface overview-food">
            <SectionHeading eyebrow="ON THE MENU" title="Your daily fuel" action={<TextLink onClick={() => changeSection('meals')}>All meals</TextLink>} />
            {planState('diet', true)}
          </section>
          <section className="surface overview-training">
            <SectionHeading eyebrow="MAKE YOUR MOVE" title="Today’s training" action={<TextLink onClick={() => changeSection('workout')}>View plan</TextLink>} />
            {planState('workout', true)}
          </section>
          <section className="surface daily-checkin">
            <SectionHeading eyebrow="TODAY, AT YOUR PACE" title="A moment to check in" />
            <span className="daily-checkin-icon"><Scale size={29} /></span>
            <h3>{todayCheckIn ? todayCheckIn.status === 'measured' ? 'Your weigh-in is saved.' : todayCheckIn.status === 'reused' ? 'Your last weight is a reference.' : 'No weight shared today.' : progress.frequency === 'off' ? 'Your routine is more than a number.' : checkInIsDue ? 'Ready for an optional check-in?' : 'Keep going at your own pace.'}</h3>
            <p>{progress.error ? 'Your weight journal is temporarily unavailable. You can retry in Progress.' : todayCheckIn ? 'Your choice is saved. You can revisit or update it in Progress.' : 'Weigh daily, weekly, or skip the number. Your food and movement logs still count.'}</p>
            <div className="daily-checkin-actions">{!todayCheckIn && progress.frequency !== 'off' && <Button variant="secondary" disabled={progress.loading || Boolean(progress.error)} onClick={() => setCheckInDate(todayStr)}>Optional check-in <Plus size={16} /></Button>}<TextLink onClick={() => { setProgressTab('trends'); changeSection('progress'); }}>View progress</TextLink></div>
          </section>
          <section className="surface quick-coach">
            <div className="quick-coach-heading">
              <CoachMark />
              <span className="eyebrow">IN YOUR CORNER</span>
            </div>
            <h3>A question can be<br />a good starting point.</h3>
            <p>Get a little guidance on food, movement, and the everyday in between.</p>
            <Button variant="secondary" onClick={() => changeSection('coach')}>Ask Guruji <ArrowUpRight size={17} /></Button>
          </section>
        </div>
      </>}
      {activeSection === 'meals' && <>
        <div className="section-toolbar">
          <Tag><Utensils size={14} />{currentDietPlan?.meals.length || 0} meals on your menu</Tag>
          <Button variant="secondary" onClick={() => setActiveModal('meal')}><Plus size={16} /> Log food</Button>
        </div>
        {planState('diet')}
      </>}
      {activeSection === 'workout' && <>
        <nav className="training-week" aria-label="Upcoming training week">{Array.from({ length: 7 }, (_, index) => {
          const key = addDays(todayStr, index);
          const date = new Date(`${key}T00:00:00Z`);
          const saved = workoutHistory[key] || JSON.parse(localStorage.getItem(getWorkoutKey(key)) || 'null');
          return <button key={key} className={key === selectedDate ? 'active' : ''} aria-current={key === selectedDate ? 'date' : undefined} onClick={() => setTrainingDate(key)}><span>{index === 0 ? 'Today' : date.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' })}</span><strong>{date.getUTCDate()}</strong><small>{saved ? saved.exercises?.length ? 'Session' : 'Recovery' : 'No plan'}</small></button>;
        })}</nav>
        <div className="section-toolbar">
          <Tag><Dumbbell size={14} /> {currentWorkoutPlan?.dayName || 'Your training space'}</Tag>
          <Button hidden={!isToday} variant="secondary" onClick={() => setActiveModal('workout')}><Plus size={16} /> Log activity</Button>
        </div>
        {planState('workout')}
      </>}
      {activeSection === 'progress' && <Progress uid={user.uid} progress={progress} onCheckIn={setCheckInDate} tab={progressTab} onTabChange={setProgressTab} historyDate={historyDate} onHistoryDateChange={setHistoryDate} />}
      {activeSection === 'profile' && <ProfileOverview user={nutritionUser} nutrition={nutrition} weightMeasurement={latestMeasurement} stats={badgeStats} onEdit={onEditProfile} />}
      {activeSection === 'coach' && <ChatCoach user={user} planContext={{ date: selectedDate, dietPlan: currentDietPlan, workoutPlan: currentWorkoutPlan }} messages={chatHistory} onUpdateMessages={updateChatHistory} />}
      <footer className="dashboard-footer">
        <span>A LITTLE BETTER, EVERY DAY.</span>
        <a href="/how-it-works">HOW IT WORKS <ArrowUpRight size={13} /></a>
      </footer>
    </main>
  </div>
  <nav className="mobile-nav" aria-label="Mobile dashboard navigation">
    {sections.map(({
        id,
        title,
        icon: Icon
      }) => <button key={id} className={activeSection === id ? 'active' : ''} aria-current={activeSection === id ? 'page' : undefined} onClick={() => changeSection(id)}>
      <Icon size={20} />
      <span>{title === 'Nutrition' ? 'Meals' : title === 'Ask Guruji' ? 'Coach' : title}</span>
    </button>)}
    <button className={activeSection === 'profile' ? 'active' : ''} aria-current={activeSection === 'profile' ? 'page' : undefined} onClick={viewProfile}>
      <Settings size={20} />
      <span>Profile</span>
    </button>
  </nav>
  {checkInDate && <WeightCheckIn entries={progress.entries} initialDate={checkInDate} saving={progress.saving} error={progress.error} onSave={progress.save} onClose={() => setCheckInDate(null)} />}
  {activeModal === 'meal' && <AddMealModal onClose={() => setActiveModal(null)} onSave={addManualMeal} />}
  {activeModal === 'workout' && <AddWorkoutModal weight={latestMeasurement?.weightKg || user.weight} onClose={() => setActiveModal(null)} onSave={addManualWorkout} />}
</div>;
};
export default Dashboard;
